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
         wavesurfer.play();
 });

 $('.controls .btn').on('click', function(){
    var action = $(this).data('action');
    console.log(action);
    switch (action) {
      case 'play':
        wavesurfer.playPause();
        break;
      case 'back':
        wavesurfer.skipBackward();
        break;
      case 'forward':
        wavesurfer.skipForward();
        break;
      case 'mute':
        wavesurfer.toggleMute();
        break;
    }
  });