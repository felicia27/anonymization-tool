import React, { Component } from 'react';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import './Player.css'

class Player extends Component {
    render() {
        const Player = () => (
            <AudioPlayer
              src={this.props.audioUrl}
              onPlay={e => console.log("onPlay")}
              // other props here
            />
        );
        
        return (
            <div className="Player">
                <Player />
            </div>
        );
    }
}

export default Player;