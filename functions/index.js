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

  return null;
});

exports.editAudio = functions.pubsub.topic('editAudioTopic').onPublish((message, context) => {
  console.log('The function was triggered at ', context.timestamp);
  console.log('The unique ID for the event is ', context.eventId);
  // Code for editing audio

  return 0;
});