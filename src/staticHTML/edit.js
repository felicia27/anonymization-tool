var userSelectText = "";
var  labelDict = {
  "Delete": [],
  "Mask": []
};

var punctuation = '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';

var wavesurfer = WaveSurfer.create({
    container: document.querySelector('#waveform'),
    waveColor: '#D9DCFF',
    progressColor: '#0A74EC',
    cursorColor: '#4353FF',
    barWidth: 3,
    barRadius: 3,
    cursorWidth: 1,
    height: 100,
    barGap: 3,
    skipLength: 5,
    plugins: [
        WaveSurfer.cursor.create({
            showTime: true,
            opacity: 1,
            customShowTimeStyle: {
                'background-color': '#000',
                color: '#fff',
                padding: '0px',
                'font-size': '10px'
            }
        })
    ]
});

wavesurfer.load('http://ia902606.us.archive.org/35/items/shortpoetry_047_librivox/song_cjrg_teasdale_64kb.mp3');
wavesurfer.on('ready', function () {
         //wavesurfer.play();
 });

 $('.controls .btn').on('click', function(){
    var action = $(this).data('action');
    console.log(action);
    var playPauseButton = document.getElementById("playPauseButtonImage")
    var muteButton = document.getElementById("muteImage")
    switch (action) {
      case 'play':
          if (wavesurfer.isPlaying()){
            wavesurfer.pause();
            playPauseButton.src = "image/play-button.png"
          }
          else {
              wavesurfer.play()
              playPauseButton.src = "image/pause-button.png"
          }
        break;
      case 'back':
        wavesurfer.skipBackward();
        break;
      case 'forward':
        wavesurfer.skipForward();
        break;
      case 'mute':
          if (wavesurfer.getMute()){
            wavesurfer.toggleMute();
            muteButton.src = "image/unmute.png"
          }
          else {
              wavesurfer.toggleMute()
              muteButton.src = "image/mute.png"
          }

        break;
    }
  });

  function removePunctuation(string) {
    return string
      .split('')
      .filter(function(letter) {
        return punctuation.indexOf(letter) === -1;
      })
      .join('');
  }

  function getSelectionText() {
    var text;

    if (window.getSelection) {
      text = window.getSelection();
        if (!text.isCollapsed) {
          var range = document.createRange();
          range.setStart(text.anchorNode, text.anchorOffset);
          range.setEnd(text.focusNode, text.focusOffset);
          var backwards = range.collapsed;
          range.detach;

          var endNode = text.focusNode, endOffset = text.focusOffset;
          text.collapse(text.anchorNode, text.anchorOffset);

          var direction = [];
          if (backwards) {
            direction = ['backward', 'forward'];
          } else {
            direction = ['forward', 'backward'];
          }
          text.modify("move", direction[0], "character");
          text.modify("move", direction[1], "word");
          text.extend(endNode, endOffset);
          text.modify("extend", direction[1], "character");
          text.modify("extend", direction[0], "word");

        }
    } else if (document.selection && document.selection.type != "Control") {
        var textRange = text.createRange();
        if (textRange.text) {
          textRange.expand("word");
          while (/\s$/.test(textRange.text)) {
            textRange.moveEnd("character", -1);

          }
          textRange.select()
        }
    }
    document.getElementById("labelSelect").classList.toggle("show");

    if (text.toString() === "") {
      console.log("empty selection")
    }
    else {
      userSelectText = removePunctuation(text.toString());
      // console.log(userSelectText);
    }

}

function highlightText() {
  range = window.getSelection().getRangeAt(0);
  var selectionContents = range.extractContents();
  var span = document.createElement("span");
  span.appendChild(selectionContents);
  span.style.backgroundColor = "lightgray";
  range.insertNode(span);
}

function getMousePosition(event){
  var x = event.pageX;
  var y = event.pageY;
  var menu = $("#labelSelect");
  menu.css('position', 'absolute');
  menu.css("left", x);
  menu.css("top", y);
}

function getLabelSelection(event){
  label = event.target.id
  // console.log(label.toString());
  return label.toString()
}

function returnDatatoBackend(event) {
  if (getLabelSelection(event) === "Delete" && userSelectText !== "") {
    labelDict["Delete"].push(userSelectText.split(" "));
    userSelectText = "";
  }
  else if (getLabelSelection(event) === "Mask" && userSelectText !== "") {
    labelDict["Mask"].push(userSelectText.split(" "));
    userSelectText = "";
  }
  console.log(labelDict);
  return labelDict;

}



document.onmouseup = function () {
    getSelectionText();
    highlightText();
    getMousePosition(event);
    returnDatatoBackend(event);
    // getLabelSelection(event);


};
