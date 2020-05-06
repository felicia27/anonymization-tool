import "./StaticHome.css";
import app from "./base";
import 'antd/dist/antd.css';
import moment from "moment";
import firebase from "firebase";
import Upload from "./upload/Upload";
import Header from "./header/Header";
import Player from "./content/Player";
import React, { Component } from "react";
import Transcript from "./content/Transcript";
import { List, Typography, Icon } from "antd";

const { Title } = Typography;

class Test extends Component {

    constructor(props) {
        super(props);

        this.db = firebase.firestore();

        this.state = {
            activeListItem: null,


        };
    }

    componentDidMount() {
        this.getAudioTranscript();
    }

    getAudioTranscript = () => {
        let currentComponent = this;
        const currentUserEmail = app.auth().currentUser.email;
        let docUser = this.db.collection("transcripts").doc(currentUserEmail);
        //currentProject is the projectId of the project the audio file is stored in
        let currentProject = currentComponent.props.match.params.projectId;
        //currentAudio is the audioId of the audio file that was clicked in the Projects page
        let currentAudio = currentComponent.props.match.params.audioId;

        let audioObjects = [];

        //This only retrieves the audio file that was clicked. If testing is needed change the exact path of the Route in App.js
        //and change the values of currentProject and currentAudio above to prevent a redirect of wiping the error from the console.
        docUser.collection("projects").doc(currentProject).collection("audios").doc(currentAudio).get().then(function(doc) {

                let audioObject = {
                    audioId: doc.id,
                    audioFileName: doc.data().fileName,
                    audioCreatedAt: moment(doc.data().createdAt.toDate()).format("MMM Do YYYY"),
                    audioUrl: doc.data().audioUrl,
                    idTranscript: doc.data().idTranscript,
                }
            audioObjects.push(audioObject);

            currentComponent.setState({
                activeListItem: audioObject
            });
        });
    }
    handle_audio_play = (beg, end) => {
      console.log(beg);
      this.refs.player.play_specific(beg, end);

    }

    render() {
        return (
            <div className="Home-container">
                <div className="Home-header">
                    <Header />

                </div>

                { this.state.activeListItem ?
                    <div className="Home-content">
                        <div className="Home-content-audioPlayer">
                            <Player {...this.state.activeListItem} ref="player" onRef={ref => (this.player = ref)} />
                        </div>

                        <div className="Home-content-transcriptView">
                            <Transcript {...this.state.activeListItem} play_audio={this.handle_audio_play} projectID={this.props.match.params.projectId} filename={this.props.match.params.audioId} docUser = {this.db.collection("transcripts").doc(app.auth().currentUser.email)}/>
                        </div>
                    </div>
                    :
                    <div className="Home-content-noSelection">
                        <div className="Home-content-noSelection-label">
                            <Title><Icon type="caret-left" style={{ marginRight: "10px" }}/>Please select an Item on the Left</Title>
                        </div>
                    </div>
                }
            </div>
        );
    }
}

export default Test;
