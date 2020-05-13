import React, { Component } from 'react'
import app from "./base";
import firebase, { storage } from "firebase";
import FileUploader from "react-firebase-file-uploader";
import "./projects.css";
import 'antd/dist/antd.css';
import moment from "moment";
import Upload from "./upload/Upload";
import { List, Typography, Icon } from "antd";
import deleteLogo from "./staticHTML/image/trash.png";
import uploadLogo from "./staticHTML/image/plus.png";
import { Link, BrowserRouter as Router, Route } from "react-router-dom";


const { Title } = Typography;

class Folder extends Component {
    constructor(props) {
        super(props);

        this.db = firebase.firestore();
    
        this.state = {
            clicked: false,
            editTitleEnabled: false,
            editDescriptionEnabled: false,
            backgroundcolor: '#6FD171',
            title: 'Project title',
            projectDescription: 'Project description'
        };
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
            title: this.refs.newTitle.value
        })
        alert(this.props.title);
    }

    updateDescription = () => {
        this.setState({
            editDescriptionEnabled: false,
            projectDescription: this.refs.newDescription.value
        })
        alert(this.props.projectDescription);
    }

    renderEditTitle = () => {
        return <div>
            <input 
                type="text" 
                defaultValue={this.props.title}
                ref="newTitle"/>
            <button className="saveButton" onClick={this.updateTitle}>Save</button>
        </div>
    }

    renderEditDescription = () => {
        return <div>
            <input 
                className="desc"
                type="text" 
                defaultValue={this.props.projectDescription}
                ref="newDescription"/>
            <button className="saveButton" onClick={this.updateDescription}>Save</button>
        </div>
    }

    renderDefaultTitle = () => {
        return <div>
            <input 
                type="text"
                defaultValue={this.props.title}
                disabled={!this.state.editTitleEnabled}
                />
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
                    <img className="fileDelete" onClick={() => this.deleteFile(audio.audioId, audio.audioFileName)} src={deleteLogo}/>
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
                            {/*onClick={this.handleEditClick.bind(this)}*/}
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
                        {/*<p id="title" ref="newText">{this.props.title}</p>
                        <p id="desc">{this.props.projectDescription}</p>
                        <input id="title" type="text" ref="newText" defaultValue={this.props.title} disabled={!this.state.editTitleEnabled}/>
                        <input id="desc" type="text" defaultValue={this.props.projectDescription} disabled={!this.state.editDescriptionEnabled}/>
                        */}

                        <p id="myFiles">Files</p>
                        
                        <Upload projectId={this.props.id}/>
                        <p id="divider">---------------------------------------------</p>
                        <div><List
                            dataSource={allProjectAudios}
                            renderItem={item => <List.Item>{item}</List.Item>}
                            /></div>
                        {/*id = {this.props.id}*/}  
                        {/*<button onClick={this.props.delete}>Delete</button>*/}

                    </div>
                </div>
            </div>
        );
    }
}

export default Folder;