// import firebase from "firebase";
import { Typography } from "antd";
import React, { Component } from 'react';
import firebase from "firebase";
import './Transcript.css'
import "./edit.css"
import { Icon } from "antd";

const { Text, Title } = Typography;
const punctuation = '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';
var userSelectText = "";


class Transcript extends Component {

    constructor(props) {
        super(props);
        this.state = {
            IDArray: [],
            update:0,
            labelDict: {"Delete": [], "Mask": []},
            lastHi: 0,
        };
        this.currentProject = this.props.projectID;
        this.currentAudio = this.props.filename;
        this.docUser = this.props.docUser;
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

    processTranscript=()=>{
        let idTranscript = JSON.parse(this.props.idTranscript);

        this.setState({
            IDArray: idTranscript,
        })
    }

    SaveChanges = (e) => {
      console.log("file saving");
      var delDict = this.state.labelDict["Delete"];
      var maskDict = this.state.labelDict["Mask"];
      var currentidTranscript = this.state.IDArray;

      for(let i = 0 ; i < maskDict.length; i++) {
         let elMasked = maskDict[i];
         currentidTranscript[elMasked]["label"] = "MASK";
      }

      for(let i = 0 ; i < delDict.length; i++) {
         let elToBeDeleted = delDict[i];
         currentidTranscript.splice(elToBeDeleted, 1);
      }

      this.db = firebase.firestore();
      this.docUser.collection("projects").doc(this.currentProject).collection("audios").doc(this.currentAudio).set( {
        idTranscript: JSON.stringify(currentidTranscript),
      }, { merge: true });
      this.setState({
        labelDict: {"Delete": [], "Mask": []},
      })
      console.log("file updated");

    }

     onMouseUpHandler = (e) =>{

       var event = window.event;
       this.getSelectionText();
       this.highlightText();
       this.displayMenu(event);
       this.recordDict(event);
     }

     removePunctuation(string) {
        return string
          .split('')
          .filter(function(letter) {
            return punctuation.indexOf(letter) === -1;
          })
          .join('');
      }

      getSelectionText() {
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
          userSelectText = this.removePunctuation(text.toString());
           console.log(userSelectText);
        }
      }

      highlightText() {
        var range = window.getSelection().getRangeAt(0);

        this.setState({
          lasthi: range,
        })
        var selectionContents = range.extractContents();
        var span = document.createElement("span");
        span.appendChild(selectionContents);
        span.style.backgroundColor = "lightgray";

        range.insertNode(span);
        console.log(range);
      }
      unhighlightText() {
        var range = this.state.lastHi;
        var selectionContents = range.extractContents();
        var span = document.createElement("span");
        span.appendChild(selectionContents);

        span.style.backgroundColor = 'transparent';
        range.insertNode(span);
      }

      displayMenu(event){
        var x = event.pageX;
        var y = event.pageY;

        var menu = document.getElementById("labelSelect");
        menu.style.position = 'absolute';
        menu.style.left = x+1000;
        menu.style.top = y;
      }

      getLabelSelection(event){
        var label = event.target.id;
        return label.toString()
      }

      displayDeleteLabel(event){
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

      displayMaskLabel(event){
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

      recordDict(event) {
        // var splitText = userSelectText.split(" ");
        if (userSelectText !== ""){
          var wordIDs = userSelectText.match(/\d+/g).map(Number);
        }
        if (this.getLabelSelection(event) === "Play" && userSelectText !== ""){
          var start = this.state.IDArray[wordIDs[0]].startTime;

          var end = this.state.IDArray[wordIDs[wordIDs.length-1]].endTime;

          this.props.play_audio(start,end);
          this.unhighlightText();
        }
        if (this.getLabelSelection(event) === "Delete" && userSelectText !== "") {


          for (var word of wordIDs) {
            var templabelDict = this.state.labelDict;
            templabelDict["Delete"].push(word);
            this.setState({
                labelDict: templabelDict,
            })
          }
          console.log(wordIDs[0]);
          console.log(wordIDs[wordIDs.length-1]);
          this.displayDeleteLabel(event);
          userSelectText = "";
        }

        else if (this.getLabelSelection(event) === "Mask" && userSelectText !== "") {
          for (var word of wordIDs) {
            var templabelDict = this.state.labelDict;
            templabelDict["Mask"].push(word);
            this.setState({
                labelDict: templabelDict,
            })
          }
          this.displayMaskLabel(event);
          userSelectText = "";
        }
        console.log(JSON.stringify(this.state.labelDict));
    }



    render() {

        let transcriptSnippets = this.state.IDArray.map((word, index) => {
            return (

                <div key={index} className="Transcript-transcription-text">

                    <span onMouseUp={this.onMouseUpHandler.bind(this)}>{word["word"]}<span className="test">{index} + " "</span></span>

                </div>
            );
        });

        return (

          <div>
          <div className="Transcript-Save">
              <form>
                  <label onClick={this.SaveChanges.bind(this)} style={{ backgroundColor: "#1890ff", color: 'white', padding: 8, borderRadius: 4, cursor: 'pointer'}}>
                      <Icon  style={{paddingRight: "10px"}} type="save" />
                      Save
                  </label>
              </form>
          </div> {/* End of Uploader Button */}

          <div className="column"></div>
          <div className="transcript_container clear">

              <div className="transcript">
                <div className="labels">
                  <div onMouseUp={this.onMouseUpHandler} id="labelSelect" className="labelSelect-content">
                    <a id="Delete">Delete</a>
                    <a id="Mask">Mask</a>
                    <a id="Play">Play</a>
                  </div>
                </div>
                <section className="clear utterance_container">
                  <div className="content_container clear">
                  <div className="speaker">
                      <select style={{width: '80px', position: 'absolute'}}>
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
