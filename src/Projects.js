import "./projects.css";
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

class Projects extends Component {
    
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
                <nav><a href="#"><img src="./staticHTML/image/menu.png"></img></a>Audio Transcription Tool
                    <a href="#"><span className="projects_label create">+ Create new project</span></a></nav>
                <div className="projects_audio_container clear">
                    <div id="waveform" style={{position:'relative'}}></div>
                </div>
        
                <div className="projects_transcript_container clear"> 
                    <div className="projects_edit_container"> 
                        <div className="projects_edit_control"><a href="audiofiles.html">
                            <div className="projects_green_border"></div>
                            <div className="projects_green_completed"></div> 
                            <div>Project 1</div>
                            <p>Project description</p>
                        </a>
                        </div>
                    </div>
                </div> 
            </div>
        );
    }
}

export default Projects;