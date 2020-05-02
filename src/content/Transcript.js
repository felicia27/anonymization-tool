// import firebase from "firebase";
import { Typography } from "antd";
import React, { Component } from 'react';
import './Transcript.css'
import "./edit.css"

const { Text, Title } = Typography;
const punctuation = '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';
var userSelectText = "";
var  labelDict = {
  "Delete": [],
  "Mask": []
};

class Transcript extends Component {
    constructor(props) {
        super(props);
        this.state = {
            transcriptArray: [],
            wordArray: [],
            IDArray: [],
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

    processTranscript = () => {
        let audioTranscript = JSON.parse(this.props.audioTranscript);
        let idTranscript = JSON.parse(this.props.idTranscript);
        // const transcription = audioTranscript.results
        //         .map(result => result.alternatives[0].transcript)
        //         .join('\n');

        let wordArray = [];
        let transcriptArray = [];
        let IDArray = []
        for (const [key, value] of Object.entries(idTranscript)) {
            console.log(key);
            console.log(value.word)
            IDArray.push({
                key: key,
                value: value.word
            });

        }

        audioTranscript.results.forEach(result => {
            
            let transcript = result.alternatives[0].transcript
            result.alternatives[0].words.forEach(wordInfo => {
                // NOTE: If you have a time offset exceeding 2^32 seconds, use the
                // wordInfo.{x}Time.seconds.high to calculate seconds.
                const startSecs =
                `${wordInfo.startTime.seconds}` +
                `.` +
                wordInfo.startTime.nanos / 100000000;
                const endSecs =
                `${wordInfo.endTime.seconds}` +
                `.` +
                wordInfo.endTime.nanos / 100000000;
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
            IDArray: IDArray,
            wordArray: wordArray
        })
        console.log(IDArray);
        console.log(wordArray);
        console.log(transcriptArray);
    }
     onMouseUpHandler(){
       var event = window.event;
       getSelectionText();

       highlightText();

       displayMenu(event);

       returnDatatoBackend(event);

     function removePunctuation(string) {
        return string
          .split('')
          .filter(function(letter) {
            return punctuation.indexOf(letter) === -1;
          })
          .join('');
      }
        function getSelectionText() {
          var text;

          if (window.getSelection) {
            text = window.getSelection();
              if (!text.isCollapsed) {
                var range = document.createRange();
                range.setStart(text.anchorNode, text.anchorOffset);
                range.setEnd(text.focusNode, text.focusOffset);
                var backwards = range.collapsed;
                range.detach();

                var endNode = text.focusNode, endOffset = text.focusOffset;
                text.collapse(text.anchorNode, text.anchorOffset);

                var direction = [];
                if (backwards) {
                  direction = ['backward', 'forward'];
                } else {
                  direction = ['forward', 'backward'];
                }
                text.modify("move", direction[0], "character");
                text.modify("move", direction[1], "word");
                text.extend(endNode, endOffset);
                text.modify("extend", direction[1], "character");
                text.modify("extend", direction[0], "word");

              }
          } else if (document.selection && document.selection.type != "Control") {
              var textRange = text.createRange();
              if (textRange.text) {
                textRange.expand("word");
                while (/\s$/.test(textRange.text)) {
                  textRange.moveEnd("character", -1);

                }
                textRange.select()
              }
          }
          document.getElementById("labelSelect").classList.toggle("show");

          if (text.toString() === "") {
            console.log("empty selection")
          }
          else {
            userSelectText = removePunctuation(text.toString());
             console.log(userSelectText);
          }
      }
      function highlightText() {
        var range = window.getSelection().getRangeAt(0);
        var selectionContents = range.extractContents();
        var span = document.createElement("span");
        span.appendChild(selectionContents);
        span.style.backgroundColor = "lightgray";
        range.insertNode(span);
      }

      function displayMenu(event){

        var x = event.pageX;
        var y = event.pageY;

        var menu = document.getElementById("labelSelect");
        menu.style.position = 'absolute';
        menu.style.left = x+1000;
        menu.style.top = y;

      }

      function getLabelSelection(event){

        var label = event.target.id;
        console.log(label.toString());
        return label.toString()
      }

      function displayDeleteLabel(event){
        var x = event.pageX;
        var y = event.pageY;
        var label_container = document.createElement('div');
        label_container.className = 'label_container';
        label_container.style.float = 'left';
        label_container.style.position = 'absolute';
        label_container.style.top = (y).toString() + 'px'
      
        label_container.innerHTML = `<span class="label delete">Delete</span>`;
      
        document.getElementsByClassName('column')[0].appendChild(label_container);
      
      }
      
      function displayMaskLabel(event){
        var x = event.pageX;
        var y = event.pageY;
        var label_container = document.createElement('div');
        label_container.className = 'label_container';
        label_container.style.float = 'left';
        label_container.style.position = 'absolute';
        label_container.style.top = (y).toString() + 'px'
      
        label_container.innerHTML = `<span class="label mask">Mask</span>`;
      
        document.getElementsByClassName('column')[0].appendChild(label_container);
      }

      function returnDatatoBackend(event) {
        
        // var splitText = userSelectText.split(" ");
        var wordIDs = userSelectText.match(/\d+/g).map(Number);
        
        if (getLabelSelection(event) === "Delete" && userSelectText !== "") {
          for (var word of wordIDs) {
            labelDict["Delete"].push(word);
            displayDeleteLabel(event);
            userSelectText = "";
          }
        }

        else if (getLabelSelection(event) === "Mask" && userSelectText !== "") {
          for (var word of wordIDs) {
            labelDict["Mask"].push(word);
            displayMaskLabel(event);
            userSelectText = "";
          }
        }
        console.log(labelDict);
        return labelDict;
    }
  }

    render() {

        let transcriptSnippets = this.state.IDArray.map((word, index) => {
            return (

                <div key={index} className="Transcript-transcription-text">

                    <span onMouseUp={this.onMouseUpHandler}>{word.value}<span className="test">{index} + " "</span></span>

                </div>
            );
        });

        // let wordSnippets = this.state.IDArray.map((word, index) => {
        //     return (
        //         <div key={index} className="Transcript-transcription-text">
        //             <span >{word.value}</span>
        //         </div>
        //     );
        // });

        return (

          <div>

          <div className="column"></div>
    

          <div className="transcript_container clear">

              <div className="transcript">
                <div className="labels">
                  <div onMouseUp={this.onMouseUpHandler} id="labelSelect" className="labelSelect-content">
                    <a id="Delete">Delete</a>
                    <a id="Mask">Mask</a>
                  </div>
                </div>
                <section className="clear utterance_container">
                  <div className="content_container clear">
                  <div className="speaker">
                      <select style={{width: '80px', position: 'absolute'}} onChange={this.nextElementSibling.value=this.value}>
                        <option>Speaker 1</option>
                        <option> Speaker 2</option>
                      </select>
                      <input style={{width: '0px', marginTop: '1px', border: 'none', position: 'relative', left: '0px', marginRight: '25px'}} defaultValue="Speaker 1" />
                    </div>
                    <div className="content">
                      <div className="timecode">00:00:03</div>
                      <div>
                      {transcriptSnippets}
                      </div>
                    </div>
                  </div>
                </section>

              </div>
            </div>
            </div>

        );
    }
}

export default Transcript;
