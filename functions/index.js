const functions = require("firebase-functions");
const path = require("path");
const fs = require("fs");
const os = require("os");
const {Storage} = require("@google-cloud/storage");
const speech = require("@google-cloud/speech");
// const firebase = require("firebase");
const admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);

// Creates a Google Cloud Storage client
const gcs = new Storage({
  projectId: "capstone-project-uci-c87c8",
});

// Creates a Speech Client
const client = new speech.SpeechClient();
const bucketName = "capstone-project-uci-c87c8.appspot.com";

let db = admin.firestore();

exports.transcribeAudio = functions.storage.bucket(bucketName).object().onFinalize( async (object) => {
  // [START eventAttributes]
  console.log("HERE FROM STATIC HTML");
  const fileBucket = object.bucket; // The Storage bucket that contains the file.
  const filePath = object.name; // File path in the bucket.
  console.log("Filepath: ", filePath);
  const filePathUserEmail = filePath.split('/')[1];
  const uuidProjectFirestoreDocId = filePath.split('/')[2].split('_')[0];
  const uuidAudioFirestoreDocId = filePath.split('/')[2].split('_')[1];
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
    const fileName = path.basename(filePath);
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
    }
    catch(e){
      [operation] = await client.longRunningRecognize(monoRequest);
    }
    finally{
      const [response] = await operation.promise();
      jsonResponse = JSON.stringify(response);
      const objectValue = JSON.parse(jsonResponse);
      const rawTranscript = objectValue['results'][0]['alternatives'][0]['transcript'];
      var wordTimeArray = objectValue['results'][0]['alternatives'][0]['words']
      var res = rawTranscript.split(" ");

      var word_dic = [];
      wordTimeArray.forEach(function (item, index) {
        start = item["startTime"]
        end = item["endTime"]
        console.log(start);
        console.log(end);
        if (start === null && end === null){
            word_dic.push({"word": item["word"]});
        }
        else if (start === null){
          if (!("seconds" in start)){
            word_dic.push({"word": item["word"], "endTime": parseInt(end["seconds"]+ end["nanos"].toString())});
          }
          else{
            word_dic.push({"word": item["word"],"endTime": parseInt(end["seconds"]+ end["nanos"].toString())});
          }
        }
        else if (end === null){
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
      var finaledTranscript = JSON.stringify(word_dic);
      console.log(word_dic);
    }
    
    
    // Get a Promise representation of the final result of the job
    

    db.collection("transcripts").doc(filePathUserEmail).collection("projects").doc(uuidProjectFirestoreDocId)
    .collection("audios").doc(uuidAudioFirestoreDocId).set({
      //transcript: jsonResponse,
      finished: true,
      idTranscript: finaledTranscript,
      //baseTranscript: rawTranscript
    }, { merge: true });

  }
  
  return null;
});

exports.deleteAudio = functions.storage.bucket(bucketName).object().onFinalize( async (object) => {
  console.log(object);
  const fileBucket = object.bucket; // The Storage bucket that contains the file.
  console.log(fileBucket);
  const filePath = object.name; // File path in the bucket. 
  //FILEPATH:  transcripts/allen072798@gmail.com/projects/e97f6945-8dd3-4779-9f49-90efae53ccb4/audios/2bac7eb5-38a7-4ab9-9638-b992b7c23e2a_record_output.wav

  const filePathUserEmail = filePath.split('/')[1];
  const uuidFirestoreDocId = filePath.split('/')[5].slice(0,36)
  const uuidProjectFirestoreDocId = filePath.split('/')[3];
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
          audioURL: oldFileData.audioURL,
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

      var startTime = message.attributes["startTime"];
      var endTime = message.attributes["endTime"];

      startTime = parseInt(startTime,10)/1000000000;
      endTime = parseInt(endTime,10)/1000000000;
      
      console.log(startTime);
      console.log(endTime);

      var atrimLine1 = "atrim=duration=";
      atrimLine1 = atrimLine1 + startTime + '[a]';

      var atrimLine2 = '[0]atrim=start=';
      atrimLine2 = atrimLine2 + endTime + '[b]';
      let command = ffmpeg(tempFilePath)
          .setFfmpegPath(ffmpegInstaller.path)
          .complexFilter([
            atrimLine1,
            atrimLine2,
            '[a][b]concat=n=2:v=0:a=1',
          ])
          .format('wav')
          .output(targetTempFilePath);

      let modifiedFilePath = filePath.split("/")[4] + "/" + filePath.split("/")[1] + "/"+ projectName + "_" + audioFilename; 
      let targetStorageFilePath = filePath.split("/")[0] + "/" + filePath.split("/")[1] + "/" + filePath.split("/")[2] + "/" + filePath.split("/")[3] + "/" + filePath.split("/")[4] + "/" + targetTempFileName;
  
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