import "./projects.css";
import app from "./base";
import 'antd/dist/antd.css';
import moment from "moment";
import Upload from "./upload/Upload";
import firebase from "firebase";
import React, { Component } from "react";
import { List, Typography, Icon , Modal, Button } from "antd";
import uploadLogo from "./staticHTML/image/plus.png";
import Folder from "./Folder.js";
import { ExclamationCircleOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { confirm } = Modal;

class Projects extends Component {

    constructor(props) {
        super(props);

        this.db = firebase.firestore();
        

        this.state = {
            projectCount: null,
            folderArray: [],
            id: "",
            title: "Project Title",
            projectDescription: "Project Description",
            projectInfo: null,
            backgroundcolor: "green"
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
                            finished: audio.data().finished,
                        }
                        audioObjects.push(audioObject);
                    });
                    let projectObject = {
                        projectId: doc.id,
                        projectName: doc.data().projectName,
                        projectDescription: doc.data().projectDescription,
                        projectCreatedAt: moment(doc.data().createdAt.toDate()).format("MMM Do YYYY"),
                        projectAudios: audioObjects,
                        projectColor: doc.data().projectColor,
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
            projectDescription: "Project Description",
            projectColor: '#6FD171',
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
                            audioEmail: currentUserEmail,
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
                        projectColor: querySnapshot.data().projectColor,
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

    deleteEvent = (index, projectId, audiosList) => {
        if(audiosList.length == 0 ){
            this.db.collection("transcripts").doc(app.auth().currentUser.email)
            .collection("projects").doc(projectId).delete().then(() => {
                console.log("Successfully deleted");
                const copyFolderArray = Object.assign([], this.state.folderArray);
                copyFolderArray.splice(index, 1);
                this.setState({
                    folderArray: copyFolderArray,
                    projectCount: this.state.projectCount-1
                })
            });
        }
        else {
            this.showConfirm();
        }
    }

    addFolder = (project) => {
        this.folderID = this.folderID +1;
        let newProject = {
            id: project.projectId,
            title: project.projectName,
            projectDescription: project.projectDescription,
            backgroundcolor: project.projectColor,
            projectInfo: project
        }
        this.setState({
            folderArray: [...this.state.folderArray, newProject]
        })
    }

    showConfirm() {
        confirm({
          title: 'Please delete all files in the project before deleting the project.',
          icon: <ExclamationCircleOutlined />,
          onOk() {
            console.log('OK');
          },
          onCancel() {
            console.log('Cancel');
          },
        });
      }

    render() {


        return (
            <div>
                <div className="ProjectHeader-container">
                
                <div className="ProjectHeader-logo">
                    <span>Data Anonymization Tool</span>
                </div>

                <div className="ProjectHeader-create">
                <Button type="primary" onClick={() => this.createProject()}>
                    + Create new project
                </Button> 
                </div>

                <div className="ProjectHeader-signOut">
                <Button type="primary" onClick={() => app.auth().signOut()}>
                    <Icon type="logout" />
                    Sign out
                </Button>
                </div>
            </div>

                {/*<nav><a href="#"></a>Audio Transcription Tool
                    <a href="#"><span className="button" onClick={() => this.createProject()}>+ Create new project</span></a></nav>
        */}
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
                            backgroundcolor={folder.backgroundcolor}
                            projectAudios={folder.projectInfo.projectAudios}
                            deleteFolder={this.deleteEvent.bind(this, index, folder.id, folder.projectInfo.projectAudios)}
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
