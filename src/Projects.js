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
            projectDescription: "Project description"
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
                let projectObject = {
                    projectId: doc.id,
                    projectFileName: doc.data().projectName,
                    projectCreatedAt: moment(doc.data().createdAt.toDate()).format("MMM Do YYYY")
                }
                projectObjects.push(projectObject);
            });
            
            currentComponent.setState({ 
                projectCount: projectObjects.length 
            });
            
            projectObjects.forEach((f) => {
                currentComponent.createFolder(f.projectFileName);
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
        const projectName = this.create_UUID() + '_Project ' + currentCount;

        console.log('create ' + projectName.slice(37));
        
        this.db.collection("transcripts").doc(this.getUsername()).collection("projects").doc(projectName.slice(0,36)).set({
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            projectName: projectName.slice(37)
        }, {merge: true});

        this.setState({
            projectCount: currentCount
        });
        
        this.createFolder(projectName.slice(37));
    }

    createFolder(folderName) {
        console.log(folderName);
        /*
        var para = document.createElement("div");
        para.innerHTML = document.getElementById("myDIV").innerHTML;
        para.setAttribute("id", "myDIV"+ this.state.projectCount);

        para.querySelector(".green_border").setAttribute("id", "border"+ this.state.projectCount);
        para.querySelector(".green_completed").setAttribute("id", "border_completed"+ this.state.projectCount);
        
        para.querySelector("p").setAttribute("id", "myP"+ this.state.projectCount);
        para.querySelector("h1").setAttribute("id", "title"+ this.state.projectCount);

        para.querySelector("h1").innerHTML = folderName;

        document.body.appendChild(para);*/
    }

    deleteEvent = (index) => {
        const copyFolderArray = Object.assign([], this.state.folderArray);
        copyFolderArray.splice(index, 1);
        this.setState({
            folderArray: copyFolderArray
        })
    }

    //delete later
    setFolder = (element) => {
        this.setState({
            projectDescription: element.target.value
        })
    }

    addFolder = () => {
        this.folderID = this.folderID +1;
        const copyFolderArray = Object.assign([], this.state.folderArray);
        copyFolderArray.push({
            id: this.folderID,
            title: this.state.title,
            projectDescription: this.state.projectDescription
        })
        this.setState({
            folderArray: copyFolderArray
        })
    }

    //delete later
    handleClick = index => {
        console.log("click")
      };
      
    render() {
        return (
            <div>
                <nav><a href="#"><img src="./staticHTML/image/menu.png"></img></a>Audio Transcription Tool
                    <a href="#"><span className="button" onClick={() => this.createProject()}>+ Create new project</span></a></nav>
                <div className="projects_audio_container clear">
                    <div id="waveform" style={{position:'relative'}}></div>
                </div>
        
                {/*<input type="text" onBlur={this.setFolder} /> */}
                <button onClick={this.addFolder}>Add Folder</button>

                {this.state.folderArray.map((folder, index)=>{
                    return(
                        <Folder
                            key={folder.id}
                            id={folder.id}
                            title={folder.title}
                            projectDescription={folder.projectDescription}
                            delete={this.deleteEvent.bind(this, index)}
                            onClick={() => this.handleClick(index)} //color button (delete)
                        />
                    )
                })}
            </div>
        );
    }
}

export default Projects;