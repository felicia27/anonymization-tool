const functions = require("firebase-functions");
const path = require("path");
const fs = require("fs");
const os = require("os");
const {Storage} = require("@google-cloud/storage");
const speech = require("@google-cloud/speech");
// const firebase = require("firebase");
const admin = require('firebase-admin');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const {PubSub} = require('@google-cloud/pubsub');
const pubSubClient = new PubSub();
admin.initializeApp(functions.config().firebase);

// Creates a Google Cloud Storage client
const gcs = new Storage({
  projectId: "capstone-project-uci-c87c8",
});

// Creates a Speech Client
const client = new speech.SpeechClient();
const bucketName = "capstone-project-uci-c87c8.appspot.com";

let db = admin.firestore();

function promisifyCommand(command) {
  return new Promise((resolve, reject) => {
    command.on('end', resolve).on('error', reject).run();
  });
}

exports.pubMessage = functions.https.onCall( async (data, context) => {
  const attributes = data.text;
  const dataBuffer = Buffer.from("Message");
  console.log(attributes);
  console.log(attributes["UUID"]);

  await pubSubClient.topic('deleteAudio').publish(dataBuffer, attributes);
});


exports.transcribeAudio = functions.storage.bucket(bucketName).object().onFinalize( async (object) => {
  // [START eventAttributes]
  const fileBucket = object.bucket; // The Storage bucket that contains the file.
  const filePath = object.name; // File path in the bucket.
  console.log(filePath);
  const filePathUserEmail = filePath.split('/')[1];
  const uuidProjectFirestoreDocId = filePath.split('/')[2].split('_')[0];
  const uuidAudioFirestoreDocId = filePath.split('/')[2].split('_')[1];
  console.log(uuidAudioFirestoreDocId);
  const contentType = object.contentType; // File content type.
  console.log("Content Type: ", contentType);
  const metageneration = object.metageneration; // Number of times metadata has been generated. New objects have a value of 1.

  // [END eventAttributes]

  // [START stopConditions]
  // Exit if this is triggered on a file that is not an image.
  if (!contentType.startsWith('audio/')) {
    return console.log('This is not an audio.');
  }

  if(filePath.endsWith("_output.wav")){
    return console.log("This is a modified file");
  }
  else{
    // Get the file name.
    const fileName = path.basename(filePath).slice(37);
    console.log("Filename: ", fileName);
    // Exit if the image is already a thumbnail.
    if (fileName.endsWith('_transcript.json')) {
      console.log('Already a transcript');
      return null;
    }
    // Exit if this is a move or deletion event.
    if (object.resourceState === "not_exists") {
      console.log("This is a deletion event.");
      return null;
    }
    // [END stopConditions]

    if(fileName.split(".")[1] !== "wav"){
      let bucket = gcs.bucket("gs://"+bucketName);
      console.log("Filepath: ", filePath);
      let audioFileName = filePath.split("/")[2];
      let tempFilePath = path.join(os.tmpdir(), audioFileName);
      let targetTempFileName = audioFileName.replace(/\.[^/.]+$/, '') + '.wav';
      const targetTempFilePath = path.join(os.tmpdir(), targetTempFileName);
      let targetStorageFilePath = filePath.replace(/\.[^/.]+$/, '') + '.wav';
      
      let command = ffmpeg(tempFilePath)
          .setFfmpegPath(ffmpegInstaller.path)
          .format('wav')
          .audioFrequency(16000)
          .output(targetTempFilePath);

      console.log("tempPath: ", tempFilePath);
      console.log("tempName: ", targetTempFileName);
      console.log(targetStorageFilePath);
      console.log("DOWNLOAD START");
      await bucket.file(filePath).download({destination: tempFilePath});
      console.log('Audio downloaded locally to', tempFilePath);

      await promisifyCommand(command);
      console.log('Output audio created at', targetTempFilePath);

      await bucket.upload(targetTempFilePath, {destination: targetStorageFilePath});
      console.log('Output audio uploaded to', targetStorageFilePath);

      fs.unlinkSync(tempFilePath);
      fs.unlinkSync(targetTempFilePath);
    }
    else{
      const audioFilename = "gs://" + fileBucket + "/" + filePath; // gcs Uri
      const request = {
        config: {
          enableWordTimeOffsets: true, // get word times
          encoding: "LINEAR16", // Encoding of audio file
          languageCode: "en-US", // BCP-47 language code
          audioChannelCount: 2,
          useEnhanced: true,
          model: "video",
        },
        audio: {
          uri: audioFilename // gcs Uri
        }
      };

      const monoRequest = {
        config: {
          enableWordTimeOffsets: true, // get word times
          encoding: "LINEAR16", // Encoding of audio file
          languageCode: "en-US", // BCP-47 language code
          useEnhanced: true,
          model: "video",
        },
        audio: {
          uri: audioFilename // gcs Uri
        }
      };


      try{
        [operation] = await client.longRunningRecognize(request);
        var [response] = await operation.promise();
      }
      catch(e){
        [operation] = await client.longRunningRecognize(monoRequest);
        var [response] = await operation.promise();
      }
      finally{
        const jsonResponse = JSON.stringify(response);
        const objectValue = JSON.parse(jsonResponse);
        console.log(objectValue);
        //const rawTranscript = objectValue['results'][0]['alternatives'][0]['transcript'];
        var wordTimeArray = objectValue['results'][0]['alternatives'][0]['words']
        //var res = rawTranscript.split(" ");
        console.log(wordTimeArray);

        var word_dic = [];
        wordTimeArray.forEach(function (item, index) {
          start = item["startTime"]
          end = item["endTime"]
          if (start == null && end == null){
              word_dic.push({"word": item["word"]});
          }
          else if (start == null){
            if (!("seconds" in start)){
              word_dic.push({"word": item["word"], "endTime": parseInt(end["seconds"]+ end["nanos"].toString())});
            }
            else{
              word_dic.push({"word": item["word"],"endTime": parseInt(end["seconds"]+ end["nanos"].toString())});
            }
          }
          else if (end == null){
            if (!("seconds" in start)){
              word_dic.push({"word": item["word"], "startTime": start["nanos"]});
            }
            else{
              word_dic.push({"word": item["word"], "startTime": parseInt(start["seconds"] + start["nanos"].toString())});
            }
          }

          else if (!("seconds" in start)){
          if (!("nanos" in end)){
            word_dic.push({"word": item["word"], "startTime": start["nanos"],"endTime": parseInt(end["seconds"]+ "000000000")});
            }
            else{
              word_dic.push({"word": item["word"], "startTime": start["nanos"],"endTime": parseInt(end["seconds"]+ end["nanos"].toString())});

            }
          }
          else{
            if (!("nanos" in start) && !("nanos" in end) ){
              console.log('both gone');
              word_dic.push({"word": item["word"], "startTime": parseInt(start["seconds"]+ "000000000"), "endTime": parseInt(end["seconds"] + "000000000")});
            }
            else if (!("nanos" in start)){
              console.log('start gone');
              word_dic.push({"word": item["word"], "startTime": parseInt(start["seconds"]+ "000000000"), "endTime": parseInt(end["seconds"]+ end["nanos"].toString())});
            }

            else if (!("nanos" in end)){
              console.log('end gone');
              word_dic.push({"word": item["word"], "startTime": parseInt(start["seconds"] + start["nanos"].toString()),"endTime": parseInt(end["seconds"]+ "000000000")});
            }
            else{
              word_dic.push({"word": item["word"], "startTime": parseInt(start["seconds"] + start["nanos"].toString()),"endTime": parseInt(end["seconds"]+ end["nanos"].toString())});

            }
          }
        });
        const finaledTranscript = JSON.stringify(word_dic);
        console.log(word_dic);

        db.collection("transcripts").doc(filePathUserEmail).collection("projects").doc(uuidProjectFirestoreDocId)
        .collection("audios").doc(uuidAudioFirestoreDocId).set({
          //transcript: jsonResponse,
          finished: true,
          idTranscript: finaledTranscript,
          //baseTranscript: rawTranscript
        }, { merge: true });
      }
      return null;
    }

  // Get a Promise representation of the final result of the job
  }

});

exports.deleteAudio = functions.storage.bucket(bucketName).object().onFinalize( async (object) => {
  // audios/email/project_UUID_filename
  console.log(object);
  const fileBucket = object.bucket; // The Storage bucket that contains the file.
  console.log(fileBucket);
  const filePath = object.name; // File path in the bucket.
  //FILEPATH:  transcripts/allen072798@gmail.com/projects/e97f6945-8dd3-4779-9f49-90efae53ccb4/audios/2bac7eb5-38a7-4ab9-9638-b992b7c23e2a_record_output.wav

  const filePathUserEmail = filePath.split('/')[1];
  const uuidFirestoreDocId = filePath.split('/')[2].split('_')[1];
  const uuidProjectFirestoreDocId = filePath.split('/')[2].split('_')[0];
  console.log(uuidFirestoreDocId);
  console.log("FILEPATH: ", filePath);
  const contentType = object.contentType; // File content type.
  console.log("Content Type: ", contentType);
  const audioFilename = "gs://" + fileBucket + "/" + filePath; // gcs Uri
  const metageneration = object.metageneration;
  if (!contentType.startsWith('audio/')) {
    return console.log('This is not an audio.');
  }

  if(!filePath.endsWith("_output.wav")){
    return console.log("Not a modified file");
  }
  else{
    const fileName = path.basename(filePath);
    console.log("FILENAME ",fileName);

    db.collection("transcripts").doc(filePathUserEmail).collection("projects").doc(uuidProjectFirestoreDocId).collection("audios").doc(uuidFirestoreDocId).get()
      .then(doc => {
        let oldFileData = doc.data();

        db.collection("transcripts").doc(filePathUserEmail).collection("projects").doc(uuidProjectFirestoreDocId).collection("audios").doc(uuidFirestoreDocId+"_modified").set({
          audioURL: oldFileData.audioUrl,
          fileName: oldFileData.fileName.replace(".wav", "_output.wav"),
          createdAt: oldFileData.createdAt,
          finished: oldFileData.finished,
          idTranscript: oldFileData.idTranscript
        }, { merge: true });

        return 0;
      })
      .catch(err => {
        console.log('Error getting documents', err);
      });

      const bucket = gcs.bucket("gs://"+bucketName);
      const file = bucket.file(filePath);

      file.getSignedUrl({
        action: 'read',
        expires: '03-09-2491'
      }).then(signedUrls => {
        db.collection("transcripts").doc(filePathUserEmail).collection("projects").doc(uuidProjectFirestoreDocId).collection("audios").doc(uuidFirestoreDocId+"_modified").set({
          downloadURL: signedUrls[0]
        }, { merge: true });
        db.collection("transcripts").doc(filePathUserEmail).collection("projects").doc(uuidProjectFirestoreDocId).collection("audios").doc(uuidFirestoreDocId).set({
          downloadURL: signedUrls[0],
          modifiedFinished: true,

        }, { merge: true });
        return 0;
      })
      .catch(err => {
        console.log('Error getting documents', err);
      });

  }
    return 0;
});

exports.deleteAudioMessage = functions.pubsub.topic('deleteAudio').onPublish(async (message, context) => {

  console.log(Buffer.from(message.data, 'base64').toString());
  console.log(message.attributes);
  let email = message.attributes["email"];
  let UUID_given = message.attributes["UUID"];
  let project_id = message.attributes["projectID"];

  let audiosRef = db.collection("transcripts").doc(email).collection("audios");
  let singleAudio = db.collection("transcripts").doc(email).collection("projects").doc(project_id).collection("audios").doc(UUID_given); //Requires a UUID
  let allAudios1 = singleAudio.get()
    .then(async doc => {
      let bucket = gcs.bucket("gs://"+bucketName);
      let fileData = doc.data();
      let filePath = singleAudio.path.toString();
      let projectName = filePath.split('/')[3];
      console.log("Filepath: ", filePath);
      let audioFilename = filePath.split('/')[5] + "_" + fileData.fileName;
      let tempFilePath = path.join(os.tmpdir(),audioFilename);
      let targetTempFileName = audioFilename.replace(/\.[^/.]+$/, '') + '_output.wav';
      const targetTempFilePath = path.join(os.tmpdir(), targetTempFileName);

      /*
      var startTime = message.attributes["startTime"];
      var endTime = message.attributes["endTime"];

      startTime = parseInt(startTime,10)/1000000000;
      endTime = parseInt(endTime,10)/1000000000;
      */

      var censorList = JSON.parse(message.attributes["censor"]);
      var deleteList = JSON.parse(message.attributes["delete"]);

      console.log("Number of censor inputs: " + censorList["numberOfInputs"]);
      console.log("Number of delete inputs: " + deleteList["numberOfInputs"]);

      var censorSize = censorList["numberOfInputs"];
      var deleteSize = deleteList["numberOfInputs"];

      var streamName;
      var censorLine = '';
      var deleteLine = '';


      // If there are any censor size requests
      if(censorSize > 0)
      {
        console.log(censorSize + " messages being censored!");

        var duration = censorList["endTime1"] - censorList["startTime1"];
        var ADstartTime = censorList["startTime1"] * 1000;

        // Mute first section of audio based on first start/end inputs
        censorLine = "[0]volume=0:enable='between(t," + censorList["startTime1"] + "," + censorList["endTime1"] + ")'";

        if(censorSize == 1)
        {
          censorLine += '[mutedStream];';
          // Generate beep for start/end times
          censorLine += "sine=d=" + duration + ":f=1000,adelay=" + ADstartTime + ",pan=stereo|FL=c0|FR=c0[beep];";
          censorLine += "[mutedStream][beep]amix=inputs=2";

          if(deleteSize > 0)
          {
            //censorLine -= "=inputs=2"
            censorLine += "[maskedAudio]";
            console.log("after adding/removing: " + censorLine);
          }

        }

        // Runs if more than one start/end time
        else{
          var beepLine = '';
          var i;

          // amix audio for first set of start/end times

          // Special edge case condition if startTime is 0
          if(censorList["startTime1"] == 0){
            beepLine += "sine=d=" + duration + ":f=1000,adelay=" + ADstartTime + ",pan=stereo|FL=c0|FR=c0[zero];"
            beepLine += "[mutedStream][zero]amix[mutedStreamzero];";
            streamName = "mutedStreamzero";
          }
          // Special edge case condition if startTime is 0
          else{
            beepLine += "sine=d=" + duration + ":f=1000,adelay=" + ADstartTime + ",pan=stereo|FL=c0|FR=c0[" + censorList["startTime1"] + "];"
            beepLine += "[mutedStream][" + censorList["startTime1"] + "]amix[mutedStream" + censorList["startTime1"] + "];";
            streamName = "mutedStream" + censorList["startTime1"];
          }

          for(i=2; i < censorSize; i++)
          {
            //generate silence for start/end times before last pair
            censorLine += ",volume=0:enable='between(t," + censorList["startTime" + i] + "," + censorList["endTime" + i] + ")'";

            // generate beep for start/end times before last pair
            duration = censorList["endTime" + i] - censorList["startTime" + i];
            ADstartTime = censorList["startTime" + i] * 1000;
            beepLine += "sine=d=" + duration + ":f=1000,adelay=" + ADstartTime + ",pan=stereo|FL=c0|FR=c0[" + censorList["startTime"+i ] + "];";

            // amix audio for start/end times before the last pair
            beepLine += "[" + streamName + "][" + censorList["startTime" + i] + "]amix[" + streamName + censorList["startTime" + i] + "];";
            streamName += censorList["startTime" + i];


          }
          // generate silence for final start/end times
          censorLine += ",volume=0:enable='between(t," + censorList["startTime" + i] + "," + censorList["endTime" + i] + ")'";
          censorLine += "[mutedStream];"

          // generate beep for final start/end times
          duration = censorList["endTime" + i] - censorList["startTime" + i];
          ADstartTime = censorList["startTime" + i] * 1000;
          beepLine += "sine=d=" + duration + ":f=1000,adelay=" + ADstartTime + ",pan=stereo|FL=c0|FR=c0[" + censorList["startTime" + i] + "];";

          // amix final audio stream together
          beepLine += "[" + streamName + "]" + "[" + censorList["startTime" + i] + "]amix=inputs=2";
          censorLine += beepLine;
          if(deleteSize > 0)
          {
            //censorLine -= "=inputs=2"
            censorLine += "[maskedAudio]";
          }
        }
      }

      if(deleteSize > 0)
      {
        console.log(deleteSize + " messages being deleted!");
        if(censorSize > 0)
        {
          deleteLine = "[maskedAudio]";
        }
        else
        {
          deleteLine = "[0]"
        }

        // Trim section starting with first startTime
        deleteLine += "aselect='between(t,0," + deleteList["startTime1"] + ")";


        // Runs for only 1 start & end time
        if(deleteSize == 1){
          deleteLine += "+between(t," + deleteList["endTime1"] + "," + "100000000000000)";
          deleteLine += "',asetpts=N/SR/TB";
        }

        // Runs for more than 1 start & end time
        else{
          var i;

          for(i=2; i <= deleteSize; i++)
          {
            deleteLine += "+between(t," + deleteList["endTime"+(i-1)] + "," + deleteList["startTime"+i] + ")"
          }

          deleteLine += "+between(t," + deleteList["endTime" + deleteSize] + "," + "100000000000000)";
          deleteLine += "',asetpts=N/SR/TB";

        }
      }

      if ((censorSize > 0) && (deleteSize > 0)){
        console.log("Both censor & delete:");
        console.log("");
        console.log("censorLine: " + censorLine);
        console.log("");
        console.log("deleteLine: " + deleteLine);

        var command = ffmpeg(tempFilePath)
          .setFfmpegPath(ffmpegInstaller.path)
          .complexFilter([
            censorLine,
            deleteLine
          ])
          .format('wav')
          .output(targetTempFilePath);
      }

      else if ((censorSize > 0) && (deleteSize <= 0))
      {
        console.log("Just censor:");
        console.log("");
        console.log("censorLine: " + censorLine);
        console.log("");
        console.log("deleteLine: " + deleteLine);

        var command = ffmpeg(tempFilePath)
          .setFfmpegPath(ffmpegInstaller.path)
          .complexFilter([
            censorLine,
          ])
          .format('wav')
          .output(targetTempFilePath);
      }

      else if ((censorSize <= 0) && (deleteSize > 0))
      {
        console.log("just delete:");
        console.log("");
        console.log("censorLine: " + censorLine);
        console.log("");
        console.log("deleteLine: " + deleteLine);

        var command = ffmpeg(tempFilePath)
          .setFfmpegPath(ffmpegInstaller.path)
          .complexFilter([
            deleteLine
          ])
          .format('wav')
          .output(targetTempFilePath);
      }

      /*
      let command = ffmpeg(tempFilePath)
          .setFfmpegPath(ffmpegInstaller.path)
          .complexFilter([
            censorLine,
            deleteLine
          ])
          .format('wav')
          .output(targetTempFilePath);
      */

      let modifiedFilePath = filePath.split("/")[4] + "/" + filePath.split("/")[1] + "/"+ projectName + "_" + audioFilename;

      // audios/email/project_UUID_filename
      let targetStorageFilePath = filePath.split("/")[4] + "/" + filePath.split("/")[1] + "/" + filePath.split("/")[3] + "_" + targetTempFileName.slice(0,36) + "_modified" +  targetTempFileName.slice(36);

      console.log(modifiedFilePath);
      console.log(targetStorageFilePath);
      console.log("DOWNLOAD START");
      await bucket.file(modifiedFilePath).download({destination: tempFilePath});
      console.log('Audio downloaded locally to', tempFilePath);

      await promisifyCommand(command);
      console.log('Output audio created at', targetTempFilePath);

      await bucket.upload(targetTempFilePath, {destination: targetStorageFilePath});
      console.log('Output audio uploaded to', targetStorageFilePath);

      fs.unlinkSync(tempFilePath);
      fs.unlinkSync(targetTempFilePath);

      console.log('Temporary files removed.', targetTempFilePath);


      return 0;
    })
    .catch(err => {
      console.log('Error getting documents', err);
    });


  return 0;
});
