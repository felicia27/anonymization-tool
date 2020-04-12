import "./audiofiles.css";
import app from "./base";
import 'antd/dist/antd.css';
import moment from "moment";
import firebase from "firebase";
import Upload from "./upload/Upload";
import Header from "./header/Header";
import Player from "./content/Player";
import React, { Component } from "react";
import Transcript from "./content/Transcript";
import { List, Typography, Icon } from "antd";

const { Title } = Typography;

class Audios extends Component {
    
    constructor(props) {
        super(props);

        this.db = firebase.firestore();

        this.state = {
            //activeListItem: null,
            //allAudioFiles: [],
        };
    }
/*
    componentDidMount() {
        this.getAudioTranscript();
    }

    getAudioTranscript = () => {
        let currentComponent = this;
        const currentUserEmail = app.auth().currentUser.email;
        let docUser = this.db.collection("transcripts").doc(currentUserEmail);
        
        let audioObjects = [];

        docUser.collection("audios").get().then(function(querySnapshot) {
            querySnapshot.forEach(function(doc) {
                // console.log(doc.id, " => ", doc.data());
                let audioObject = {
                    audioId: doc.id,
                    audioFileName: doc.data().fileName,
                    audioCreatedAt: moment(doc.data().createdAt.toDate()).format("MMM Do YYYY"),
                    audioUrl: doc.data().audioUrl,
                    audioTranscript: doc.data().transcript,
                }
                audioObjects.push(audioObject);
            });
            currentComponent.setState({ 
                allAudioFiles: [...currentComponent.state.allAudioFiles, ...audioObjects ] 
            });
        });
    }

    // This syntax ensures `this` is bound within handleClick.
    // Warning: this is *experimental* syntax.
    handleClick = (audioId) => {
        this.setState({
            activeListItem: audioId
        });
    }
    */
    render() {/*
        let allAudioList = this.state.allAudioFiles.map(audio => {
            return (
                <a href="/#" onClick={() => this.handleClick(audio)} key={ audio.audioId } className="ListAudioFiles-a">
                    <p className="ListAudioFiles-title">{audio.audioFileName}</p>
                </a>
            );
        });*/

        return (
            <div>
                <nav><a href="projects.html"><img src="image/back.png"></img></a>Project 1 
                <div className="label upload"><Upload/></div></nav>
                <div className="audio_container clear">
           
                <div id="waveform" style={{position:'relative'}}></div>
                </div>

                <div className="transcript_container clear"> 
                    <div className="edit_container"> 
               
                        <div className="edit_control"><a href="edit.html">
                        <div>audiofile1.wav</div></a></div>
                    </div>
                </div> 
            </div>
        );
    }
}

export default Audios;