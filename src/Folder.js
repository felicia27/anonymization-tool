import React, { Component } from 'react'
import app from "./base";
import firebase from "firebase";
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
        };
    }
    
    handleClick = event => {
        this.setState({ 
            clicked: !this.state.clicked 
        }, () => { // Should prob use the callback that setState provides
            if (this.props.onClick) this.props.onClick() 
        });
    };

    textChange(inputEntry) {
        console.log(inputEntry)
        if (inputEntry == 'rename') {
            this.renderEditView();
            this.setState({
                editTitleEnabled: !this.state.editTitleEnabled
            }) 
        } else if (inputEntry == 'edit') {
            this.setState({
                editDescriptionEnabled: !this.state.editDescriptionEnabled
            })
        } 
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

    renderEditView = () => {
        return <div>
            <input 
            type="text" 
            defaultValue={this.props.title}/>
        <button onClick={this.changeEditMode}>X</button>
        <button onClick={this.updateComponentValue}>OK</button>
        </div>
    }

    updateComponentValue = () => {
        this.setState({
            editTitleEnabled: false,
            title: this.refs.theTextInput.value 
        })
    }

    render() {
        let allProjectAudios = this.props.projectAudios.map(audio => {
            return(
                <Link to={"test/" + this.props.id + "/" + audio.audioId} key={audio.audioId}>{audio.audioFileName}</Link>
            );
        });

        const { backgroundcolor } = this.state
        return (
            <div>
                <div id="myDIV" className="project_container" >
                    <div className="folder">
                        <div className="green_border" style={{backgroundColor: backgroundcolor}}></div>
                        <div className="green_completed" style={{backgroundColor: backgroundcolor}}></div>

                        <a id="deleteButton" role="button" onClick={this.props.delete}><img src={deleteLogo}/></a>

                        {/*<select id="deleteBox" onChange={() => this.deleteFolder(this, this.options[this.selectedIndex].value)}>
                            <option style={{display: "none"}}></option>
                            <option value="delete">Delete</option>
                        </select>*/}

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
                        
                        <input type="text" defaultValue={this.props.title} disabled={!this.state.editTitleEnabled}/>
                        <input id="desc" type="text" defaultValue={this.props.projectDescription} disabled={!this.state.editDescriptionEnabled}/>
                        <p id="myFiles">Files</p>
                        <img id="addFile" src={uploadLogo}></img>
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