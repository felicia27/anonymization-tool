import "./projects.css";
import app from "./base";
import 'antd/dist/antd.css';
import moment from "moment";
import Upload from "./upload/Upload";
import firebase from "firebase";
import React, { Component } from "react";
import { List, Typography, Icon } from "antd";

const { Title } = Typography;

class Projects extends Component {
    
    constructor(props) {
        super(props);

        this.db = firebase.firestore();

        this.state = {
            projectCount: null
        };
    }

    componentDidMount() {
        this.getProjects();
    }


    getProjects = () => {
        let currentComponent = this;
        const currentUserEmail = app.auth().currentUser.email;
        let docUser = this.db.collection("transcripts").doc(currentUserEmail);
        
        let projectObjects = [];

        docUser.collection("projects").get().then(function(querySnapshot) {
            querySnapshot.forEach(function(doc) {
                // console.log(doc.id, " => ", doc.data());
                let projectObject = {
                    projectId: doc.id,
                    projectFileName: doc.data().fileName,
                    projectCreatedAt: moment(doc.data().createdAt.toDate()).format("MMM Do YYYY")
                }
                projectObjects.push(projectObject);
            });
            currentComponent.setState({ 
                projectCount: projectObjects.length 
            });
        });
    }

   create_UUID = () => {
        var dt = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (dt + Math.random()*16)%16 | 0;
            dt = Math.floor(dt/16);
            return (c=='x' ? r :(r&0x3|0x8)).toString(16);
        });
        return uuid;
    }

    getUsername = () => app.auth().currentUser.email;

    createProject() {
        var currentCount = this.state.projectCount;
        currentCount++;
        const filename = this.create_UUID() + '_project' + currentCount;

        console.log('create ' + filename.slice(37));
        
        this.db.collection("transcripts").doc(this.getUsername()).collection("projects").doc(filename.slice(0,36)).set({
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            projectName: filename.slice(37)
        }, {merge: true});

        this.setState({
            projectCount: currentCount
        });
    }

    render() {
        return (
            <div>
                <nav><a href="#"><img src="./staticHTML/image/menu.png"></img></a>Audio Transcription Tool
                    <a href="#"><span className="projects_label create" onClick={() => this.createProject()}>+ Create new project</span></a></nav>
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