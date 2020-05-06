import React, { Component } from 'react';
import './Player.css'
import WaveSurfer from 'wavesurfer.js';
var wavesurfer;
class Player extends Component {


    componentDidMount(){
       this.props.onRef(this);
          wavesurfer = WaveSurfer.create({
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
              // plugins: [
              //     WaveSurfer.cursor.create({
              //         showTime: true,
              //         opacity: 1,
              //         customShowTimeStyle: {
              //             'background-color': '#000',
              //             color: '#fff',
              //             padding: '0px',
              //             'font-size': '10px'
              //         }
              //     })
              // ]
          });


          console.log(this.props.audioUrl);
          wavesurfer.load(this.props.audioUrl);

          wavesurfer.on('ready', function () {
                   //wavesurfer.play();
           });
    }
    componentWillUnmount() {
    this.props.onRef(undefined);
  }
    play_specific(beg, end){
      var playPauseButton = document.getElementById("playPauseButtonImage");

      playPauseButton.src = require("./image/pause-button.png");
      wavesurfer.play(beg/1000000000, end/1000000000);

      


    }
     controlHandler(action){


        var playPauseButton = document.getElementById("playPauseButtonImage")
        var muteButton = document.getElementById("muteImage")
        switch (action) {
          case 'play':
              if (wavesurfer.isPlaying()){
                wavesurfer.pause();
                playPauseButton.src = require("./image/play-button.png")
              }
              else {
                  wavesurfer.play()
                  playPauseButton.src = require("./image/pause-button.png")
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
                muteButton.src = require("./image/unmute.png")
              }
              else {
                  wavesurfer.toggleMute()
                  muteButton.src = require("./image/mute.png")
              }

            break;
        }
      }

    render() {




        return (
          <div className="audio_container clear">
          <div id="waveform" style={{position: 'relative'}}>
          </div>


              <div className="controls">
                <button onClick = {() => this.controlHandler("back")} className="btn btn-primary" data-action="back" style={{backgroundColor: 'transparent', borderColor: 'transparent'}}>
                  <img src={require("./image/rewind.png")} width="40px" height="40px" />
                </button>
                <button onClick = {() => this.controlHandler("play")} className="btn btn-primary" data-action="play" style={{backgroundColor: 'transparent', borderColor: 'transparent'}}>
                  <img id="playPauseButtonImage" src={require("./image/play-button.png")} width="40px" height="40px" />
                </button>
                <button onClick = {() => this.controlHandler("forward")} className="btn btn-primary" data-action="forward" style={{backgroundColor: 'transparent', borderColor: 'transparent'}}>
                  <img src={require("./image/fast-forward.png")} width="40px" height="40px" />
                </button>
                <button onClick = {() => this.controlHandler("mute")} className="btn btn-primary" data-action="mute" style={{backgroundColor: 'transparent', borderColor: 'transparent'}}>
                  <img id="muteImage" src={require("./image/unmute.png")} width="40px" height="40px" />
                </button>
              </div>

          </div>

        );
    }
}

export default Player;
