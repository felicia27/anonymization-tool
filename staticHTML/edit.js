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

  function getSelectionText() {
    var text = "";
    if (window.getSelection) {
        text = window.getSelection().toString();
    } else if (document.selection && document.selection.type != "Control") {
        text = document.selection.createRange().text;
    }
    console.log(text);
    return text;
}


function highlightText() {
  range = window.getSelection().getRangeAt(0);
  var selectionContents = range.extractContents();
  var span = document.createElement("span");
  span.appendChild(selectionContents);
  span.style.backgroundColor = "lightgray";
  range.insertNode(span);
}

document.onmouseup = function () {
    getSelectionText();
    highlightText();
};


 