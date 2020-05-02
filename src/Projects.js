import "./projects.css";
import app from "./base";
import 'antd/dist/antd.css';
import moment from "moment";
import Upload from "./upload/Upload";
import firebase from "firebase";
import React, { Component } from "react";
import { List, Typography, Icon } from "antd";
import uploadLogo from "./staticHTML/image/plus.png";
import { Link, BrowserRouter as Router, Route } from "react-router-dom";

const { Title } = Typography;

class Projects extends Component {
    
    constructor(props) {
        super(props);

        this.db = firebase.firestore();

        this.state = {
            projectCount: null,
            allProjects: []
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
                    allProjects: [...projectObjects]
                    });
                });
            });
            /*
            projectObjects.forEach((f) => {
                currentComponent.createFolder(f.projectFileName);
            });*/
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
                    allProjects: [...currentComponent.state.allProjects,...projectObjects]
                    });
                });
            });
        });

        
        
        //this.createFolder(projectName.slice(37));
    }

    createFolder(folderName) {
        console.log(folderName);
        var para = document.createElement("div");
        para.innerHTML = document.getElementById("myDIV").innerHTML;
        para.setAttribute("id", "myDIV"+ this.state.projectCount);

        para.querySelector(".green_border").setAttribute("id", "border"+ this.state.projectCount);
        para.querySelector(".green_completed").setAttribute("id", "border_completed"+ this.state.projectCount);
        
        para.querySelector("p").setAttribute("id", "myP"+ this.state.projectCount);
        para.querySelector("h1").setAttribute("id", "title"+ this.state.projectCount);

        para.querySelector("h1").innerHTML = folderName;

        document.body.appendChild(para);
    }

    editFolder(current, c){
        console.log(document.getElementById("border"+ this.state.projectCount));
        
        if (c == "rename")
        {
            document.getElementById("title"+ this.state.projectCount).contentEditable = true;
        }
        if (c == "edit")
        {
            document.getElementById("myP"+ this.state.projectCount).contentEditable = true;
        }
    }

    colorFolder(current, c){
        console.log(document.getElementById("border"+ this.state.projectCount));

        if (c == "green")
        {
            document.getElementById("border"+ this.state.projectCount).style.backgroundColor = "#6FD171";
            document.getElementById("border_completed"+ this.state.projectCount).style.backgroundColor = "#6FD171";
        }
        if (c == "red")
        {

            document.getElementById("border"+ this.state.projectCount).style.backgroundColor = "#FF5E5E";
            document.getElementById("border_completed"+ this.state.projectCount).style.backgroundColor = "#FF5E5E";
        }
        if (c == "blue")
        {
            document.getElementById("border"+ this.state.projectCount).style.backgroundColor = "#5D94FF";
            document.getElementById("border_completed"+ this.state.projectCount).style.backgroundColor = "#5D94FF";
        }
    }

    render() {
        

        return (
            <div>
                <nav><a href="#"><img src="./staticHTML/image/menu.png"></img></a>Audio Transcription Tool
                    <a href="#"><span className="button" onClick={() => this.createProject()}>+ Create new project</span></a></nav>
                <div className="projects_audio_container clear">
                    <div id="waveform" style={{position:'relative'}}></div>
                </div>
        
                <div id="myDIV"  className="project_container">
                    {this.state.allProjects.map(project => {

                        let projectAudioList = project.projectAudios.map(audio => {
                            return(
                                <Link to={"/test/" + project.projectId + "/" + audio.audioId}>{audio.audioFileName}</Link>
                                //<a key={audio.audioId}>
                                //    <p>{audio.audioFileName}</p>
                                //</a>
                            );
                        });

                        return(
                            <div className="folder" key={project.projectId}>
                                <div id="border" className="green_border"></div>
                                <div id="border_completed" className="green_completed"></div>
                        
                                <select id="deleteBox" onChange={() => this.deleteFolder(this, this.options[this.selectedIndex].value)}>
                                    <option style={{display: "none"}}></option>
                                    <option value="delete">Delete</option>
                                </select>

                                <select id="editBox" onChange={() => this.editFolder(this, this.options[this.selectedIndex].value)}>
                                    <option style={{display: "none"}}></option>
                                    <option value="rename">Rename</option>
                                    <option value="edit">Edit description</option>
                                </select>

                                <select id="colorBox" onChange={() => this.colorFolder(this, this.options[this.selectedIndex].value)}>
                                    <option style={{display: "none"}}></option>
                                    <option value="green">Green</option>
                                    <option value="red">Red</option>
                                    <option value="blue">Blue</option>
                                </select>
                                
                                <h1>{project.projectName}</h1>
                                <p id="myP">{project.projectDescription}</p>
                                <p id="myFiles">Files</p>
                                <img id="addFile" src={uploadLogo}></img>
                                <p id="divider">---------------------------------------------</p>
                                <div><List
                                    dataSource={projectAudioList}
                                    renderItem={item => <List.Item>{item}</List.Item>}/></div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
}

export default Projects;