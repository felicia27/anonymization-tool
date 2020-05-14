const functions = require("firebase-functions");
const path = require("path");
const fs = require("fs");
const os = require("os");
const {Storage} = require("@google-cloud/storage");
const speech = require("@google-cloud/speech");
// const firebase = require("firebase");
const admin = require('firebase-admin');
const ffmpeg = require('fluent-ffmpeg');
const ffmpeg_static = require('ffmpeg-static');
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

  await pubSubClient.topic('editAudioTopic').publish(dataBuffer, attributes);
});

exports.transcribeAudio = functions.storage.bucket(bucketName).object().onFinalize( async (object) => {
  // [START eventAttributes]
  const fileBucket = object.bucket; // The Storage bucket that contains the file.
  const filePath = object.name; // File path in the bucket.
  const filePathUserEmail = filePath.split('/')[1];
  const uuidFirestoreDocId = filePath.split('/')[2].slice(0,36)
  console.log(uuidFirestoreDocId);
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
    }
    
    
    // Get a Promise representation of the final result of the job
    


    db.collection("transcripts").doc(filePathUserEmail).collection("audios").doc(uuidFirestoreDocId).set({
      transcript: jsonResponse
    }, { merge: true });

  }
  
  return null;
});

exports.deleteAudio = functions.storage.bucket(bucketName).object().onFinalize( async (object) => {
  console.log(object);
  const fileBucket = object.bucket; // The Storage bucket that contains the file.
  console.log(fileBucket);
  const filePath = object.name; // File path in the bucket.
  const filePathUserEmail = filePath.split('/')[1];
  const uuidFirestoreDocId = filePath.split('/')[2].slice(0,36)
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

    db.collection("transcripts").doc(filePathUserEmail).collection("audios").doc(uuidFirestoreDocId).get()
      .then(doc => {
        let oldFileData = doc.data();
        
        db.collection("transcripts").doc(filePathUserEmail).collection("audios").doc(uuidFirestoreDocId+"_modified").set({
          audioURL: audioFilename,
          fileName: oldFileData.fileName.replace(".wav", "_output.wav"),
          createdAt: oldFileData.createdAt,
          transcript: oldFileData.transcript
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
        db.collection("transcripts").doc(filePathUserEmail).collection("audios").doc(uuidFirestoreDocId+"_modified").set({
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

exports.editAudio = functions.pubsub.topic('editAudioTopic').onPublish((message, context) => {
  console.log('The function was triggered at ', context.timestamp);
  console.log('The unique ID for the event is ', context.eventId);
  console.log('Another log was made at this moment.');
  // Code for editing audio

  console.log(message);
  console.log("Method 2", message.attributes["UUID"]);

  return 0;
});

exports.deleteAudioMessage = functions.pubsub.topic('deleteAudio').onPublish(async (message, context) => {
  console.log(Buffer.from(message.data, 'base64').toString());

  let email = message.attributes["email"];
  let UUID_given = message.attributes["UUID"];

  let audiosRef = db.collection("transcripts").doc(email).collection("audios");
  let singleAudio = db.collection("transcripts").doc(email).collection("audios").doc(UUID_given); //Requires a UUID
  let allAudios1 = singleAudio.get()
    .then(async doc => {
      let bucket = gcs.bucket("gs://"+bucketName);
      let fileData = doc.data();
      let filePath = singleAudio.path.toString();
      let audioFilename = filePath.split('/')[3] + "_" + fileData.fileName;
      let tempFilePath = path.join(os.tmpdir(),audioFilename);
      let targetTempFileName = audioFilename.replace(/\.[^/.]+$/, '') + '_output.wav';
      const targetTempFilePath = path.join(os.tmpdir(), targetTempFileName);

      var startTime = message.attributes["startTime"];
      var endTime = message.attributes["endTime"];

      startTime = startTime/1000000000;
      endTime = endTime/1000000000;

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

      let modifiedFilePath = filePath.split("/")[2] + "/" + filePath.split("/")[1] + "/" + audioFilename; 
      let targetStorageFilePath = filePath.split("/")[2] + "/" + filePath.split("/")[1] + "/" + targetTempFileName;
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
  // let allAudios = audiosRef.get()
  //   .then(snapshot => {
  //     snapshot.forEach(doc => {
  //       console.log(doc.data());
  //     });
  //     return 0;
  //   })
  //   .catch(err => {
  //     console.log('Error getting documents', err);
  //   });
  
  // Code for editing audio

  return 0;
});

exports.censorAudioMessage = functions.pubsub.topic('deleteAudio').onPublish(async (message, context) => {
  
  console.log(Buffer.from(message.data, 'base64').toString());

  let email = message.attributes["email"];
  let UUID_given = message.attributes["UUID"];

  let audiosRef = db.collection("transcripts").doc(email).collection("audios");
  let singleAudio = db.collection("transcripts").doc(email).collection("audios").doc(UUID_given); //Requires a UUID
  let allAudios1 = singleAudio.get()
    .then(async doc => {
      let bucket = gcs.bucket("gs://"+bucketName);
      let fileData = doc.data();
      let filePath = singleAudio.path.toString();
      let audioFilename = filePath.split('/')[3] + "_" + fileData.fileName;
      let tempFilePath = path.join(os.tmpdir(),audioFilename);
      let targetTempFileName = audioFilename.replace(/\.[^/.]+$/, '') + '_output.wav';
      const targetTempFilePath = path.join(os.tmpdir(), targetTempFileName);

      var startTime = message.attributes["startTime"];
      var endTime = message.attributes["endTime"];

      // Convert time from nanoseconds -> seconds
      startTime = startTime/1000000000;
      endTime = endTime/1000000000;

      var duration = endTime - startTime;
      var ADstartTime = startTime * 1000;
      
      // Silence original clip for beep duration
      var censorLine1 = "[0]volume=0:enable='between(t,";
      censorLine1 = censorLine1 + startTime + "," + endTime + ")'[inputfile]";

      // Create sine wave
      var censorLine2 = "sine=d=";
      censorLine2 = censorLine2 + duration + ":f=1000,adelay=" + ADstartTime + ",pan=stereo|FL=c0|FR=c0[beep]";

      let command = ffmpeg(tempFilePath)
          .setFfmpegPath(ffmpegInstaller.path)
          .complexFilter([
            censorLine1,
            censorLine2,
            '[inputfile][beep]amix=inputs=2',
          ])
          .format('wav')
          .output(targetTempFilePath);

      let modifiedFilePath = filePath.split("/")[2] + "/" + filePath.split("/")[1] + "/" + audioFilename; 
      let targetStorageFilePath = filePath.split("/")[2] + "/" + filePath.split("/")[1] + "/" + targetTempFileName;
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
  // let allAudios = audiosRef.get()
  //   .then(snapshot => {
  //     snapshot.forEach(doc => {
  //       console.log(doc.data());
  //     });
  //     return 0;
  //   })
  //   .catch(err => {
  //     console.log('Error getting documents', err);
  //   });
  
  // Code for editing audio

  return 0;
});