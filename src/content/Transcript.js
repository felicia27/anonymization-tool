// import firebase from "firebase";
import { Typography } from "antd";
import React, { Component } from 'react';
import './Transcript.css'
import firebase from "firebase";

const { Text, Title } = Typography;


class Transcript extends Component {
    constructor(props) {
        super(props);
        this.state = {
            transcriptArray: [],
            wordArray: [],
            update:0
        }
    }

    
    componentDidMount() {
        this.processTranscript();
    }
    
    componentDidUpdate(prevProps) {
        if(prevProps.audioId !== this.props.audioId) {
            this.processTranscript();
            this.setState({
                update: this.state.update + 1,
            });
        }
    }

    downloadAudio = () => {
        window.open(this.props.audioDownload);
    }

    handleClick = () => {
        let audioData = {UUID: '4621ab52-1497-4358-be36-328138545a5d', email: 'allen072798@gmail.com', startTime: '1', endTime: '5'};
        
        let pubMessage = firebase.functions().httpsCallable('pubMessage');
        pubMessage({text: audioData});
    }

    processTranscript = () => {
        let audioTranscript = JSON.parse(this.props.audioTranscript);
        
        // const transcription = audioTranscript.results
        //         .map(result => result.alternatives[0].transcript)
        //         .join('\n');

        let wordArray = [];
        let transcriptArray = [];
        audioTranscript.results.forEach(result => {
            // console.log(`Transcription: ${result.alternatives[0].transcript}`);
            let transcript = result.alternatives[0].transcript
            result.alternatives[0].words.forEach(wordInfo => {
                // NOTE: If you have a time offset exceeding 2^32 seconds, use the
                // wordInfo.{x}Time.seconds.high to calculate seconds.
                let startSecs = `${wordInfo.startTime.seconds}` + `.` + wordInfo.startTime.nanos / 100000000;
                if(wordInfo.startTime.seconds === undefined || isNaN(wordInfo.startTime.seconds)){
                    startSecs = `0` + `.` + wordInfo.startTime.nanos / 100000000;
                    if(wordInfo.startTime.nanos / 100000000 === undefined || isNaN(wordInfo.startTime.nanos / 100000000)){
                        startSecs = `0` + `.` + '0';
                    }
                }
                if(wordInfo.startTime.nanos / 100000000 === undefined || isNaN(wordInfo.startTime.nanos / 100000000)){
                    startSecs = `${wordInfo.startTime.seconds}` + `.` + '0';
                }
                
                let endSecs = `${wordInfo.endTime.seconds}` + `.` + wordInfo.endTime.nanos / 100000000; 
                if(wordInfo.endTime.seconds === undefined || isNaN(wordInfo.endTime.seconds)){
                    endSecs = `0` + `.` + wordInfo.endTime.nanos / 100000000;
                    if(wordInfo.endTime.nanos / 100000000 === undefined || isNaN(wordInfo.endTime.nanos / 100000000)){
                        endSecs = `0` + `.` + '0';
                    }
                }
                if(wordInfo.endTime.nanos / 100000000 === undefined || isNaN(wordInfo.endTime.nanos / 100000000)){
                    endSecs = `${wordInfo.endTime.seconds}` + `.` + '0';
                }

                let key = `${wordInfo.word}`;
                let value = `${startSecs} secs - ${endSecs} secs`;
                wordArray.push({
                    key: key,
                    value: value
                });
            });
            transcriptArray.push(transcript);
        });
        this.setState({
            transcriptArray:transcriptArray ,
            wordArray: wordArray
        })
    }
    
    render() {

        let transcriptSnippets = this.state.transcriptArray.map((transcript, index) => {
            return (
                <div key={index} className="Transcript-transcription-text">
                    <Text>{transcript}</Text>
                </div>
            );
        });

        let wordSnippets = this.state.wordArray.map((word, index) => {
            return (
                <div key={index} className="Transcript-transcription-text">
                    <Text ><strong>{word.key}</strong>: {word.value}</Text>
                </div>
            );
        });

        return (
            <div className="Transcript-container">
                <div onClick={() => this.handleClick()} className="Pub-button">
                    <label style={{ backgroundColor: "#1890ff", color: 'white', padding: 10, borderRadius: 4, cursor: 'pointer'}}>
                        EXPORT AUDIO
                    </label>
                </div>
                <div onClick={() => this.downloadAudio()} className="Download-button">
                    <label style={{ backgroundColor: "#1890ff", color: 'white', padding: 10, borderRadius: 4, cursor: 'pointer'}}>
                        DOWNLOAD AUDIO
                    </label>
                </div>
                <div className="Transcript-transcription">
                    <Title level={2}>Transcription</Title>
                    {transcriptSnippets}
                </div>
                <div className="Transcript-words">
                    <Title level={2}>Word offset</Title>
                    {wordSnippets}
                </div>
            </div>
        );
    }
}

export default Transcript;