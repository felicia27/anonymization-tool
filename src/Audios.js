import "./audiofiles.css";
import app from "./base";
import 'antd/dist/antd.css';
import moment from "moment";
import firebase, { auth } from "firebase";
import Upload from "./upload/Upload";
import React, { Component, useContext } from "react";
import Transcript from "./content/Transcript";
import { List, Typography, Icon } from "antd";
import { AuthContext } from "./Auth";

const { Title } = Typography;

class Audios extends Component {
    
    constructor(props) {
        super(props);

        this.db = firebase.firestore();

        this.state = {
            
        };
    }



    render() {
        return (
            <div>
                <nav><a href="projects.html"><img src="image/back.png"></img></a>Project 1 
                <div className="label upload">Upload</div></nav>
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