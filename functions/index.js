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

  if(fileName.split('.')[1] !== 'wav'){
    let bucket = gcs.bucket("gs://" + bucketName);
    let audioFilename = filePath.split('/')[2];
    let tempFilePath = path.join(os.tmpdir(),audioFilename);
    let targetTempFileName = audioFilename.replace(/\.[^/.]+$/, '') + '.wav';
    const targetTempFilePath = path.join(os.tmpdir(), targetTempFileName);
    let targetStoragePath = filePath.replace(/\.[^/.]+$/, '') + '.wav';

    let command = ffmpeg(tempFilePath).setFfmpegPath(ffmpegInstaller.path).format('wav')
    .audioChannels(1).audioFrequency(16000).output(targetTempFilePath);

    console.log("DOWNLOAD START");
    await bucket.file(filePath).download({destination: tempFilePath});
    console.log("Audio downloaded locally to ", tempFilePath);

    await promisifyCommand(command);
    console.log("Output audio created at ", targetTempFilePath);

    await bucket.upload(targetTempFilePath, {destination: targetStoragePath});
    console.log("Output audio uploaded to ", targetStoragePath);

    fs.unlinkSync(tempFilePath);
    fs.unlinkSync(targetTempFilePath);

    //const oldFile = bucket.file(filePath);
    //oldFile.delete();
  }
  else {
    const audioFilename = "gs://" + fileBucket + "/" + filePath; // gcs Uri
    const request = {
      config: {
        enableWordTimeOffsets: true, // get word times
        encoding: "LINEAR16", // Encoding of audio file
        sampleRateHertz: 16000, // Sample rate
        languageCode: "en-US", // BCP-47 language code
        useEnhanced: true,
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
});
