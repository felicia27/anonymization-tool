import difflib from 'difflib';
import everpolate from 'everpolate';
// using neighboring words to set missing start and end time when present
function interpolationOptimization(wordsList) {
  return wordsList.map((word, index) => {
    let wordTmp = word;
    // setting the start time of each unmatched word to the previous word’s end time - when present
    // does not first element in list edge case

    if (('startTime' in word) && (index !== 0)) {
      const previousWord = wordsList[index - 1];
      if ('endTime' in previousWord) {
        if ('label' in word){
          wordTmp = {
            word: word.word,
            startTime: previousWord.endTime,
            endTime: word.endTime,
            label: word.label,
            x: word.x,
            y: word.y
          };
        }
      }
    }
    // TODO: handle first item ?
    // setting the end time of each unmatched word to the next word’s start time - when present
    // does handle last element in list edge case
    if (('endTime' in word) && (index !== (wordsList.length - 1))) {
      const nextWord = wordsList[index + 1];
      if ('startTime' in nextWord) {
        if ('label' in word){
          wordTmp = {
            word: word.word,
            startTime: word.startTime,
            endTime: nextWord.startTime,
            label: word.label,
            x: word.x,
            y: word.y

          };
        }
      }
    }
    // TODO: handle last item ?
    return wordTmp;
  });
}

// after the interpolation, some words have overlapping timecodes.
// the end time of the previous word is greater then the start of the current word
// altho negligible when using in a transcript editor context
// we want to avoid this, coz it causes issues when using the time of the words to generate
// auto segmented captions. As it results in sentence
// boundaries overlapping on screen during playback
function adjustTimecodesBoundaries(words) {

  return words.map((word, index, arr) => {
    // excluding first element
    if (index != 0 ) {
      const previousWord = arr[index - 1];
      const currentWord = word;
      if (previousWord.endTime > currentWord.startTime) {
        word.startTime = previousWord.endTime;
      }

      return word;
    }

    return word;
  });
}

export const interpolate = (wordsList) => {
  const words = interpolationOptimization(wordsList);
  const indicies = [ ...Array(words.length).keys() ];
  const indiciesWithStart = [];
  const indiciesWithEnd = [];
  const startTimes = [];
  const endTimes = [];

  words.forEach((word, index) => {
    if ('startTime' in word) {
      indiciesWithStart.push(index);
      startTimes.push(word.startTime);
    }

    if ('endTime' in word) {
      indiciesWithEnd.push(index);
      endTimes.push(word.endTime);
    }
  });
  // http://borischumichev.github.io/everpolate/#linear
  const outStartTimes = everpolate.linear(indicies, indiciesWithStart, startTimes);
  const outEndTimes = everpolate.linear(indicies, indiciesWithEnd, endTimes);
  const wordsResults = words.map((word, index) => {
    if (!('startTime' in word)) {
      word.startTime = outStartTimes[index];
    }
    if (!('endTime' in word)) {
      word.endTime = outEndTimes[index];
    }

    return word;
  });

  return adjustTimecodesBoundaries(wordsResults);
}

// /**
//  *
//  * @param {array} transDic - array of STT words
//  * @param {array} editedWords - array of base text accurate words
//  */
 export const alignWords = (transDic, editedWords) => {
   console.log(transDic, editedWords)

   var transDicWords = [];
   // # convert words to lowercase and remove numbers and special characters

//   const transDicStripped = transDic.map((word) => {
//      normaliseWord(word.word);
//   });
   transDic.forEach((word) => {
     transDicWords.push(word.word);
   });

//
//   const editedWordsStripped = editedWords.map((word) => {
//     return normaliseWord(word);
//   });
//   // # create empty list to receive data
//
  var transcriptData = [];

  // empty objects as place holder
  editedWords.forEach(() => {
    transcriptData.push({});
  });
//   // # populate transcriptData with matching words
//   // // if they are same length, just interpolate words ?
//   // http://qiao.github.io/difflib.js/
  const matcher = new difflib.SequenceMatcher(null, transDicWords, editedWords);

  const opCodes = matcher.getOpcodes();
  console.log("opCodes", opCodes);
  console.log("transDic", transDic);

  opCodes.forEach((opCode) => {
    const matchType = opCode[0];
    const sttStartIndex = opCode[1];
    const sttEndIndex = opCode[2];
    const baseTextStartIndex = opCode[3];

    if (matchType === 'equal' ) {
      // slice does not not include the end - hence +1
      const sttDataSegment = transDic.slice(sttStartIndex, sttEndIndex);

      console.log("sttDataSegment", sttDataSegment);
      console.log("transcriptData", transcriptData);
      console.log(...sttDataSegment);
      transcriptData.splice(baseTextStartIndex, sttDataSegment.length, ...sttDataSegment);

    }
    if (matchType == 'replace'){
      const sttDataSegment = transDic.slice(sttStartIndex, sttEndIndex);

      console.log("sttDataSegment", sttDataSegment);
      console.log("transcriptData", transcriptData);
      console.log(...sttDataSegment);
      transcriptData.splice(baseTextStartIndex, sttDataSegment.length, ...sttDataSegment);

    }

    transcriptData.forEach((wordObject, index) => {
      wordObject.word = editedWords[index];
    });
    // # replace words with originals
  });

//
//   // # fill in missing timestamps
//

   return interpolate(transcriptData);
 }
