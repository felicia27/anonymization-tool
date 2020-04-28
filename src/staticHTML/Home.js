import "./Home.css";
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

class Home extends Component {

    constructor(props) {
        super(props);

        this.db = firebase.firestore();

        this.state = {
            activeListItem: null,
            allAudioFiles: [],
        };
    }

    componentDidMount() {
        this.getAudioTranscript();
    }

    getAudioTranscript = () => {
        let currentComponent = this;
        const currentUserEmail = app.auth().currentUser.email;
        let docUser = this.db.collection("transcripts").doc(currentUserEmail);

        let audioObjects = [];

        docUser.collection("audios").get().then(function(querySnapshot) {
            querySnapshot.forEach(function(doc) {
                // console.log(doc.id, " => ", doc.data());
                let audioObject = {
                    audioId: doc.id,
                    audioFileName: doc.data().fileName,
                    audioCreatedAt: moment(doc.data().createdAt.toDate()).format("MMM Do YYYY"),
                    audioUrl: doc.data().audioUrl,
                    audioTranscript: doc.data().transcript,
                    idTranscript: doc.data().idTranscript,
                }
                audioObjects.push(audioObject);
            });
            currentComponent.setState({
                allAudioFiles: [...currentComponent.state.allAudioFiles, ...audioObjects ]
            });
        });
    }

    // This syntax ensures `this` is bound within handleClick.
    // Warning: this is *experimental* syntax.
    handleClick = (audioId) => {
        this.setState({
            activeListItem: audioId
        });
    }

    render() {
        let allAudioList = this.state.allAudioFiles.map(audio => {
            return (
                <a href="/#" onClick={() => this.handleClick(audio)} key={ audio.audioId } className="ListAudioFiles-a">
                    <p className="ListAudioFiles-title">{audio.audioFileName}</p>
                </a>
            );
        });

        return (
            <div className="Home-container">
                <div className="Home-header">
                    <Header />
                </div>

                <div className="Home-sidebar">
                    {/* <ListAudioFiles /> */}
                    <div className="ListAudioFiles-container ListAudioFiles-scrollStyle">
                        <List
                            size="small"
                            header={<div className="ListAudioFiles-header"><Upload /></div>} // Upload button in header
                            footer={<div className="ListAudioFiles-footer">End of list</div>}
                            itemLayout="vertical"
                            // bordered
                            dataSource={allAudioList}
                            renderItem={item => <List.Item className="ListAudioFiles-item">{item}</List.Item>}
                        />
                    </div>
                </div>


                { this.state.activeListItem ?
                    <div className="Home-content">
                        <div className="Home-content-audioPlayer">
                            <Player {...this.state.activeListItem} />
                        </div>

                        <div className="Home-content-transcriptView">
                            <Transcript {...this.state.activeListItem} />
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

export default Home;
