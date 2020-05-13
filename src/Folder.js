import React, { Component } from 'react'
import app from "./base";
import firebase, { storage } from "firebase";
import FileUploader from "react-firebase-file-uploader";
import "./projects.css";
import 'antd/dist/antd.css';
import moment from "moment";
import Upload from "./upload/Upload";
import { List, Typography, Icon , Modal } from "antd";
import deleteLogo from "./staticHTML/image/trash.png";
import uploadLogo from "./staticHTML/image/plus.png";
import { Link, BrowserRouter as Router, Route } from "react-router-dom";


const { Title } = Typography;
const { confirm } = Modal;

class Folder extends Component {
    constructor(props) {
        super(props);

        this.db = firebase.firestore();
    
        this.state = {
            clicked: false,
            editTitleEnabled: false,
            editDescriptionEnabled: false,
            backgroundcolor: '#6FD171'
        };

        this.title = React.createRef();
        this.projectDescription = React.createRef();
    }
    
    handleClick = event => {
        event.persist();
        this.setState({ 
            clicked: !this.state.clicked 
        }, () => { // Should prob use the callback that setState provides
            if (this.props.onClick) this.props.onClick() 
        });
    };

    deleteFile(audioId, audioFileName) {
        const currentUser = app.auth().currentUser.email;
        let storage = firebase.storage();
        let storageRef = storage.ref()
        let deleteRef = storageRef.child("audios/" + currentUser + "/" + this.props.id + "_" + audioId + "_" + audioFileName);
        deleteRef.delete().then(() => {
            this.db.collection("transcripts").doc(currentUser)
            .collection("projects").doc(this.props.id).collection("audios").doc(audioId).delete().then(() => {
                console.log("Fully deleted " + audioFileName)
                window.location.reload();
            });
        })
    }

    showConfirm(audioId, audioFileName) {
        let currentComponent = this;
        confirm({
          title: 'Are you sure you want to delete this file?',
          onOk() {
            console.log('OK');
            currentComponent.deleteFile(audioId, audioFileName);
          },
          onCancel() {
            console.log('Cancel');
          },
        });
      }

    textChange(inputEntry) {
        console.log(inputEntry)
        if (inputEntry == 'rename') {
            this.editTitleMode();
        } else if (inputEntry == 'edit') {
            this.editDescriptionMode();
        } 
    }

    editTitleMode = () => {
        this.setState({
            editTitleEnabled: !this.state.editTitleEnabled
        })
    }

    editDescriptionMode = () => {
        this.setState({
            editDescriptionEnabled: !this.state.editDescriptionEnabled
        })
    }

    colorChange(inputEntry) {
        if (inputEntry == 'green') {
            this.setState({
                backgroundcolor: '#6FD171'
            }) 
        } else if (inputEntry == 'red') {
            this.setState({
                backgroundcolor: '#FF5E5E'
            }) 
        } else if (inputEntry == 'blue') {
            this.setState({
                backgroundcolor: '#5D94FF'
            }) 
        }
    }

    updateTitle = () => {
        this.setState({
            editTitleEnabled: false,
        })
        const currentUserEmail = app.auth().currentUser.email;
        let docUser = this.db.collection("transcripts").doc(currentUserEmail);
        docUser.collection("projects").doc(this.props.id).set({
            projectName: this.title.current.value}, {merge:true})
    }

    updateDescription = () => {
        this.setState({
            editDescriptionEnabled: false,
        })
        const currentUserEmail = app.auth().currentUser.email;
        let docUser = this.db.collection("transcripts").doc(currentUserEmail);
        docUser.collection("projects").doc(this.props.id).set({
            projectDescription: this.projectDescription.current.value}, {merge:true})
    }

    renderEditTitle = () => {
        return <div>
            <input 
                type="text" 
                defaultValue={this.props.title}
                ref={this.title}/>
            <button className="saveButton" onClick={this.updateTitle}>Save</button>
        </div>
    }

    renderEditDescription = () => {
        return <div>
            <input 
                className="desc"
                type="text" 
                defaultValue={this.props.projecDescription}
                ref={this.projectDescription}/>
            <button className="saveButton" onClick={this.updateDescription}>Save</button>
        </div>
    }

    renderDefaultTitle = () => {
        return <div>
            <input 
                type="text"
                defaultValue={this.props.title}
                disabled={!this.state.editTitleEnabled}/>
        </div>
    }

    renderDefaultDescription = () => {
        return <div>
            <input
                className="desc"
                type="text" 
                defaultValue={this.props.projectDescription} 
                disabled={!this.state.editDescriptionEnabled}/>
        </div>
    }

    render() {
        let allProjectAudios = this.props.projectAudios.map(audio => {
            return(
                <div>
                    <img className="fileDelete" style={{cursor: "pointer"}}onClick={() => this.showConfirm(audio.audioId, audio.audioFileName)} src={deleteLogo}/>
                    <Link to={"/edit/" + this.props.id + "/" + audio.audioId} key={audio.audioId} className="link">{audio.audioFileName}</Link>
                </div>
            );
        });

        const { backgroundcolor } = this.state
        return (
            <div>
                <div id="myDIV" className="project_container" >
                    <div className="folder">
                        <div className="green_border" style={{backgroundColor: backgroundcolor}}></div>
                        <div className="green_completed" style={{backgroundColor: backgroundcolor}}></div>

                        <a id="deleteButton" role="button" onClick={this.props.deleteFolder}><img src={deleteLogo}/></a>

                        <select id="editBox" onChange={(evt) => this.textChange(evt.target.value)}>
                            <option style={{display: "none"}}></option>
                            <option value="rename" >Rename</option>
                            <option value="edit">Edit description</option>
                        </select>

                        <select id="colorBox" onChange={(evt) => this.colorChange(evt.target.value)}>
                            <option style={{display: "none"}}></option>
                            <option value="green">Green</option>
                            <option value="red">Red</option>
                            <option value="blue">Blue</option>
                        </select>

                        {this.state.editTitleEnabled ? this.renderEditTitle() : this.renderDefaultTitle()}
                        {this.state.editDescriptionEnabled ? this.renderEditDescription() : this.renderDefaultDescription()}
                      
                        <p id="myFiles">Files</p>
                        
                        <Upload projectId={this.props.id}/>
                        <p id="divider">---------------------------------------------</p>
                        <div><List
                            dataSource={allProjectAudios}
                            renderItem={item => <List.Item>{item}</List.Item>}/>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Folder;