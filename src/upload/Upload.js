import React, { Component } from 'react'
import app from "../base";
import firebase from "firebase";
import FileUploader from "react-firebase-file-uploader";
import "./Upload.css";
import { Icon } from "antd";
import uploadLogo from "./plus.png";

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}
class Upload extends Component {
    state = {
        audio: "",
        isUploading: false,
        progress: 0,
        audioURL: "",
        GCDone: false
    };

    db = firebase.firestore();

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

    handleUploadStart = () => this.setState({ isUploading: true, progress: 0 });

    handleProgress = progress => this.setState({ progress });

    handleUploadError = error => {
        this.setState({ isUploading: false });
        console.error(error);
    };

    handleUploadSuccess = filename => {
      this.setState({ audio: filename, progress: 13});
        // console.log(filename);
        firebase
            .storage()
            .ref("audios/" + this.getUsername())
            .child(filename)
            .getDownloadURL()
            .then(url => {
                this.db.collection("transcripts").doc(this.getUsername()).set({
                    userEmail: this.getUsername()
                }).then(function() {
                    console.log("Document successfully written.");
                })
                .catch(function(error) {
                    console.error("Error adding document: ", error);
                });

                // Add a new document with a generated id.
                this.db.collection("transcripts").doc(this.getUsername()).collection("projects").doc(this.props.projectId)
                .collection("audios").doc(filename.slice(37,73)).set({
                    audioUrl: url,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    fileName: filename.slice(74), //small hack to save duplicate files in gcs and also keep the original file name in Firestore
                    finished: false,
                    idTranscript: [],
                }, { merge: true })
                .then(function() {
                    console.log("Document successfully written.");
                })
                .catch(function(error) {
                    console.error("Error adding document: ", error);
                });
                this.checkDB();
                //this.setState({ progress: 99, isUploading: true });
                console.log("finished running");
                this.setState({audioURL: url});
          });
    };
    async checkDB(){
      this.setState({ progress: 35, isUploading: true });
      var gcpFinished = false;
      var progress = 35;
      while (gcpFinished == false)
      {
          await sleep(1000);
          this.db.collection("transcripts").doc(this.getUsername()).collection("projects").doc(this.props.projectId)
          .collection("audios").doc(this.state.audio.slice(37,73)).get()
          .then(doc => {

            if (doc.data().finished != false)
            {
              this.setState({progress: 99});

              gcpFinished = true;
            }

            if (progress < 82)
            {
              progress += 17;
              this.setState({progress: progress});
            }
          })
          .catch(function(error) {
              console.error("Error adding document: ", error);
          });

      }
      this.setState({ progress: 100, isUploading: false, GCDone: true });
    }

    render() {
        return (
            <div className="Upload-container">
                <div className="Upload-button">
                    <form>
                        <label style={{ cursor: 'pointer'}}>
                        <img id="addFile" src={uploadLogo}></img>
                            <FileUploader
                            hidden
                            accept="audio/*"
                            filename={file => this.props.projectId + '_' + this.create_UUID() + '_' + file.name}
                            storageRef={firebase.storage().ref('audios/' + this.getUsername())}
                            onUploadStart={this.handleUploadStart}
                            onUploadError={this.handleUploadError}
                            onUploadSuccess={this.handleUploadSuccess}
                            onProgress={this.handleProgress}
                            />
                        </label>
                    </form>
                </div> {/* End of Uploader Button */}

                <div className="Upload-progress">
                    {this.state.isUploading && <div className="progressBar">
                        <progress value={this.state.progress} max="100"/>
                        <span>Progress: {this.state.progress}%</span></div>}

                    {this.state.GCDone && <div className="fade-animation">File uploaded</div>}
                    {this.state.GCDone && window.location.reload()}
                </div>
            </div>
        );
    }
}

export default Upload
