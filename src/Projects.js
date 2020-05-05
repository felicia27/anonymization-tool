import "./projects.css";
import app from "./base";
import 'antd/dist/antd.css';
import moment from "moment";
import Upload from "./upload/Upload";
import firebase from "firebase";
import React, { Component } from "react";
import { List, Typography, Icon } from "antd";
import uploadLogo from "./staticHTML/image/plus.png";
import Folder from "./Folder.js";
import { Link, BrowserRouter as Router, Route } from "react-router-dom";

const { Title } = Typography;

class Projects extends Component {
    
    constructor(props) {
        super(props);

        this.db = firebase.firestore();

        this.state = {
            projectCount: null,
            folderArray: [],
            id: "",
            title: "Project Title",
            projectDescription: "Project description",
            projectInfo: null
        };

        this.folderID = 0;
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
                let audioObjects = [];
                docUser.collection("projects").doc(doc.id).collection("audios").get().then(function(audioSnapShot) {
                    audioSnapShot.forEach(function(audio) {
                        let audioObject = {
                            audioId: audio.id,
                            audioFileName: audio.data().fileName,
                            audioCreatedAt: moment(audio.data().createdAt.toDate()).format("MMM Do YYYY"),
                            audioUrl: audio.data().audioUrl,
                            audioTranscript: audio.data().transcript,
                            idTranscript: audio.data().idTranscript,
                        }
                        audioObjects.push(audioObject);
                    });
                    let projectObject = {
                        projectId: doc.id,
                        projectName: doc.data().projectName,
                        projectDescription: doc.data().projectDescription,
                        projectCreatedAt: moment(doc.data().createdAt.toDate()).format("MMM Do YYYY"),
                        projectAudios: audioObjects,
                    }
                    projectObjects.push(projectObject);
                    
                    currentComponent.setState({ 
                    projectCount: projectObjects.length,
                    });
                
                    
                    currentComponent.addFolder(projectObject);
                    
                });
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
        let currentComponent = this;
        const currentUserEmail = app.auth().currentUser.email;
        let docUser = this.db.collection("transcripts").doc(currentUserEmail);

        var currentCount = this.state.projectCount;
        currentCount++;
        const projectName = this.create_UUID() + '_Project ' + currentCount;

        console.log('create ' + projectName.slice(37));
        
        docUser.collection("projects").doc(projectName.slice(0,36)).set({
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            projectName: projectName.slice(37),
            projectDescription: ""
        }, {merge: true}).then(() => {
            let projectObjects = [];
            docUser.collection("projects").doc(projectName.slice(0,36)).get().then(function(querySnapshot) {
                    // console.log(doc.id, " => ", doc.data());
                let audioObjects = [];
                docUser.collection("projects").doc(querySnapshot.id).collection("audios").get().then(function(audioSnapShot) {
                    audioSnapShot.forEach(function(audio) {
                        let audioObject = {
                            audioId: audio.id,
                            audioFileName: audio.data().fileName,
                            audioCreatedAt: moment(audio.data().createdAt.toDate()).format("MMM Do YYYY"),
                            audioUrl: audio.data().audioUrl,
                            audioTranscript: audio.data().transcript,
                            idTranscript: audio.data().idTranscript,
                        }
                        audioObjects.push(audioObject);
                    });
                    let projectObject = {
                        projectId: querySnapshot.id,
                        projectName: querySnapshot.data().projectName,
                        projectDescription: querySnapshot.data().projectDescription,
                        projectCreatedAt: moment(querySnapshot.data().createdAt.toDate()).format("MMM Do YYYY"),
                        projectAudios: audioObjects,
                    }
                    projectObjects.push(projectObject);
                    
                    currentComponent.setState({ 
                    projectCount: currentComponent.state.projectCount + projectObjects.length,
                    });

                    currentComponent.addFolder(projectObject);
                });
            });
        });
    }

    deleteEvent = (index) => {
        const copyFolderArray = Object.assign([], this.state.folderArray);
        copyFolderArray.splice(index, 1);
        this.setState({
            folderArray: copyFolderArray
        })
    }

    addFolder = (project) => {
        this.folderID = this.folderID +1;
        let newProject = {
            id: project.projectId,
            title: project.projectName,
            projectDescription: project.projectDescription,
            projectInfo: project
        }
        this.setState({
            folderArray: [...this.state.folderArray, newProject]
        })
    }

    render() {
        

        return (
            <div>
                <nav><a href="#"><img src="./staticHTML/image/menu.png"></img></a>Audio Transcription Tool
                    <a href="#"><span className="button" onClick={() => this.createProject()}>+ Create new project</span></a></nav>
                <div className="projects_audio_container clear">
                    <div id="waveform" style={{position:'relative'}}></div>
                </div>
                <div id="folderAlign">
                {this.state.folderArray.map((folder, index)=>{
                    return(
                        <Folder
                            key={folder.id}
                            id={folder.id}
                            title={folder.title}
                            projectDescription={folder.projectDescription}
                            projectAudios={folder.projectInfo.projectAudios}
                            delete={this.deleteEvent.bind(this, index)}
                            onClick={() => this.handleClick(index)} //color button (delete)
                        />
                    )
                })}
                </div>
            </div>
        );
    }
}

export default Projects;