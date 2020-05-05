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

  const audioFilename = "gs://" + fileBucket + "/" + filePath; // gcs Uri
  const request = {
    config: {
      enableWordTimeOffsets: true, // get word times
      encoding: "LINEAR16", // Encoding of audio file
      sampleRateHertz: 16000, // Sample rate
      languageCode: "en-US", // BCP-47 language code
    },
    audio: {
      uri: audioFilename // gcs Uri
    }
  };

  const [operation] = await client.longRunningRecognize(request);

  // Get a Promise representation of the final result of the job
  const [response] = await operation.promise();
  const jsonResponse = JSON.stringify(response);
  const objectValue = JSON.parse(jsonResponse);
  const rawTranscript = objectValue['results'][0]['alternatives'][0]['transcript'];
  var wordTimeArray = objectValue['results'][0]['alternatives'][0]['words']
  var res = rawTranscript.split(" ");

  var word_dic = [];
  wordTimeArray.forEach(function (item, index) {
  	start = item["startTime"]
    end = item["endTime"]
  	if (!("seconds" in start)){
  		word_dic.push({"word": item["word"], "startTime": start["nanos"].toString(),"endTime": end["seconds"]+ end["nanos"].toString(), "label": "unlabeled"});
	  }
    else{
    	 word_dic.push({"word": item["word"], "startTime": start["seconds"] + start["nanos"].toString(),"endTime": end["seconds"]+ end["nanos"].toString(), "label": "unlabeled"});
    }
  });
  const finaledTranscript = JSON.stringify(word_dic);

  db.collection("transcripts").doc(filePathUserEmail).collection("projects").doc(uuidProjectFirestoreDocId)
  .collection("audios").doc(uuidAudioFirestoreDocId).set({
    //transcript: jsonResponse,
    finished: true,
    idTranscript: finaledTranscript,
    //baseTranscript: rawTranscript
  }, { merge: true });

  return null;
});
