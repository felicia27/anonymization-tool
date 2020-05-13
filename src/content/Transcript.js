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
            labelDict: {"Delete": [], "Mask": [], "Edit":[]},
            editedText: "",
        };
        this.currentProject = this.props.projectID;
        this.currentAudio = this.props.filename;
        this.docUser = this.props.docUser;
    }

    textChange(event) {
      this.setState({
        editedText: event.target.value,
      })
    }

    componentWillMount() {
      document.addEventListener('mousedown', this.handleClick, false);
    }

    componentWillUnmount() {
      document.removeEventListener('mousedown', this.handleClick, false);
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

    handleClick = (e) => {
      var menu = document.getElementById("labelSelect");
      if (this.node.contains(e.target)) {
        this.highlightText(e);
        return;
      }
      menu.style.display = "none";
    }

    processTranscript=()=>{
        let idTranscript = JSON.parse(this.props.idTranscript);

        this.setState({
            IDArray: idTranscript,
        })
    }

    SaveChanges = (e) => {
      this.getEditedText()

      var delDict = this.state.labelDict["Delete"];
      var maskDict = this.state.labelDict["Mask"];
      var editDict = this.state.labelDict["Edit"];
      var currentidTranscript = this.state.IDArray;

      for(let i = 0 ; i < editDict.length; i++) {
         let elEdited = editDict[i][0];
         currentidTranscript[elEdited]["word"] = editDict[i][1];

      }
      for(let i = 0 ; i < maskDict.length; i++) {
         let elMasked = maskDict[i][0];
         currentidTranscript[elMasked]["label"] = "MASK";
         currentidTranscript[elMasked]["x"] = maskDict[i][1];
         currentidTranscript[elMasked]["y"] = maskDict[i][2];
      }

      for(let i = 0 ; i < delDict.length; i++) {
         let elToBeDeleted = delDict[i];
         var editInTrans = document.getElementById(elToBeDeleted);
         editInTrans.style.backgroundColor = 'transparent';
         var time_span = parseInt(currentidTranscript[elToBeDeleted].endTime) - parseInt(currentidTranscript[elToBeDeleted].startTime);
         currentidTranscript.splice(elToBeDeleted, 1);
         for (let n = elToBeDeleted; n<currentidTranscript.length; n++)
         {
           var newStartTime = parseInt(currentidTranscript[n].startTime) - time_span;
           var newEndTime = parseInt(currentidTranscript[n].endTime) - time_span;
           currentidTranscript[n].startTime = newStartTime.toString();
           currentidTranscript[n].endTime = newEndTime.toString();

         }
      }
      this.db = firebase.firestore();
      this.docUser.collection("projects").doc(this.currentProject).collection("audios").doc(this.currentAudio).set( {
        idTranscript: JSON.stringify(currentidTranscript),
      }, { merge: true });
      this.setState({
        labelDict: {"Delete": [], "Mask": [], "Edit": []},
      })
      alert("File Updated");
    }

     onMouseUpHandler = (e) =>{
       var event = window.event;
       this.getSelectionText();
       this.displayMenu(event);
       this.recordDict(event);
     }

     enterPressed(event) {
      var code = event.keyCode || event.which;
      var textBox = document.getElementById("editTextBox")
      if(code === 13) { //13 is the enter keycode
          //Do stuff in here

          var templabelDict = this.state.labelDict;
            templabelDict["Edit"][templabelDict["Edit"].length-1].push(this.state.editedText);

            //templabelDict["Edit"][templabelDict["Edit"].length-1];
            //this.state.editedText;
            var editInTrans = document.getElementById(templabelDict["Edit"][templabelDict["Edit"].length-1][0]);
            editInTrans.style.backgroundColor = 'green';
            this.setState({
                labelDict: templabelDict,
                editedText: "",
            })
          textBox.style.display = "none";
          textBox.value = "";
      }
      console.log(JSON.stringify(this.state.labelDict));
  }

     removePunctuation(string) {
        return string
          .split('')
          .filter(function(letter) {
            return punctuation.indexOf(letter) === -1;
          })
          .join('');
      }
      
    getEditedText() {
      var contenteditable = document.querySelector('[contenteditable]'),
      text = contenteditable.textContent;
      console.log(text, "TEXT!!")
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

      highlightText(event) {
        var range = window.getSelection().getRangeAt(0);

        if (this.getLabelSelection(event) == "Mask" || this.getLabelSelection(event) == "Delete"){
            var selectionContents = range.extractContents();
            var span = document.createElement("span");
            span.appendChild(selectionContents);
            span.style.backgroundColor = "lightgray";
            range.insertNode(span);
         }
        this.setState({
          lastHi: range,
        })
      }

      displayMenu(event){
        var x = event.pageX;
        var y = event.pageY;
        var menu = document.getElementById("labelSelect");
        menu.style.display = "block";
        menu.style.position = 'absolute';
        menu.style.margin = (y-350)+"px 0px 0px " +(x+30)+"px";
      }

      getLabelSelection(event){
        var label = event.target.id;
        return label.toString()
      }

      displayDeleteLabel(event){
        var x = event.pageX;
        var y = event.pageY;
        y -= 100;
        var label_container = document.createElement('div');
        label_container.className = 'label_container';
        label_container.style.float = 'left';
        label_container.style.position = 'absolute';
        label_container.style.top = (y).toString() + 'px'
        label_container.innerHTML = `<span class="label delete">Delete</span>`;
        document.getElementsByClassName('column')[0].appendChild(label_container);
        document.getElementById("labelSelect").style.display = 'none';
      }

      displayMaskLabel(event){
        var x = event.pageX;
        var y = event.pageY;
        y -= 100;
        var label_container = document.createElement('div');
        label_container.className = 'label_container';
        label_container.style.float = 'left';
        label_container.style.position = 'absolute';
        label_container.style.top = (y).toString() + 'px'
        label_container.innerHTML = `<span class="label mask">Mask</span>`;
        document.getElementsByClassName('column')[0].appendChild(label_container);
        document.getElementById("labelSelect").style.display = 'none';
      }
      updateMaskLabel(x, y){
        var label_container = document.createElement('div');
        label_container.className = 'label_container';
        label_container.style.float = 'left';
        label_container.style.position = 'absolute';
        label_container.style.top = y.toString() + 'px'
        label_container.innerHTML = `<span class="label mask">Mask</span>`;
        document.getElementsByClassName('column')[0].appendChild(label_container);
        document.getElementById("labelSelect").style.display = 'none';
      }

      recordDict(event) {
        if (userSelectText !== ""){
          var wordIDs = userSelectText.match(/\d+/g).map(Number);
        }
        if (this.getLabelSelection(event) === "Play" && userSelectText !== ""){
          var start = this.state.IDArray[wordIDs[0]].startTime;
          var end = this.state.IDArray[wordIDs[wordIDs.length-1]].endTime;
          this.props.play_audio(start,end);
          document.getElementById("labelSelect").style.display = 'none';
        }
        if (this.getLabelSelection(event) === "Delete" && userSelectText !== "") {
          for (var word of wordIDs) {
            var templabelDict = this.state.labelDict;
            templabelDict["Delete"].push(word);
            this.setState({
                labelDict: templabelDict,
            })
          }
          this.displayDeleteLabel(event);
          userSelectText = "";
        }
        else if (this.getLabelSelection(event) === "Mask" && userSelectText !== "") {
          var x = event.pageX;
          var y = event.pageY;
          for (var word of wordIDs) {
            var templabelDict = this.state.labelDict;
            templabelDict["Mask"].push([word, x, y]);
            this.setState({
                labelDict: templabelDict,
            })
          }
          this.displayMaskLabel(event);
          userSelectText = "";
        }
        else if (this.getLabelSelection(event) === "Edit" && userSelectText !== "") {
          var textBox = document.getElementById("editTextBox")
          textBox.style.display = "block";
          for (var word of wordIDs) {
            var templabelDict = this.state.labelDict;
            templabelDict["Edit"].push([word]);
            this.setState({
                labelDict: templabelDict,
            })
          document.getElementById("labelSelect").style.display = 'none';
          userSelectText = "";
        }

        console.log(JSON.stringify(this.state.labelDict));
    }
  }


    firstWordTimeN(){
      return this.state.IDArray[0]["startTime"];
    }
    lastWordTimeN(){

      return this.state.IDArray[this.state.IDArray.length-1]["endTime"];
    }


    timeStampClicked = ()=>{
      this.props.play_audio(this.firstWordTimeN(),this.lastWordTimeN());
      console.log("pressed");
      var Stamp = document.getElementById("timeStamp");
      Stamp.style.color = 'lightgreen';

    };
    render() {

        let transcriptSnippets = this.state.IDArray.map((word, index) => {
            if (word["label"] == "unlabeled")
            {
              return (
                  <div id={index} key={index} className="Transcript-transcription-text">
                      <span onMouseUp={this.onMouseUpHandler.bind(this)}>{word["word"]}<span className="test">{index} </span></span>
                  </div>
              );
            }
            if (word["label"] == "MASK") {
              this.updateMaskLabel(word["x"], word["y"]-100);
              return (
                  <div id={index} key= {index} className="Transcript-transcription-text">
                      <span style = {{backgroundColor: "lightgray"}} onMouseUp={this.onMouseUpHandler.bind(this)}>{word["word"]}<span className="test">{index} + " "</span></span>
                  </div>
              );
            }
        });
        let firstWordTimeSec = this.state.IDArray.map((word, index)=>{
          if (index == 0){
            return word["startTime"]/1000000000;
          }
        });
        return (
          <div>
              <div className="Transcript-Save">
                  <form>
                      <label onClick={this.SaveChanges.bind(this)} style={{ backgroundColor: "#1890ff", color: 'white', padding: 8, borderRadius: 4, cursor: 'pointer', position: "absolute", right: 0, bottom:380}}>
                          <Icon  style={{paddingRight: "10px"}} type="save" />
                          Save
                      </label>
                  </form>
              </div>
              <div className="column"></div>
            <div className="transcript_container clear">
              <div className="transcript">

                <div className="labels">
                  <div ref = {node => this.node = node} onMouseUp={this.onMouseUpHandler} id="labelSelect" className="labelSelect-content">
                    <a id="Delete">Delete</a>
                    <a id="Mask">Mask</a>
                    <a id="Edit">Edit</a>
                    <a id="Play">Play</a>
                  </div>
                </div>
                <section className="clear utterance_container">
                  <div className="content_container clear">

                    <div className="speaker">
                      <select style={{width: '100px', position: 'absolute'}} onchange="this.nextElementSibling.value=this.value">
                        <option>Speaker 1</option>
                        <option> Speaker 2</option>
                      </select>
                      <input style={{width: '70px', marginTop: '1px', border: 'none', position: 'relative', left: '1px', marginRight: '25px'}} defaultValue="Speaker 1" />
                    </div>


                    <div className="content">
                      <button  onClick={this.timeStampClicked.bind(this)} id = "timeStamp" style = {{color: 'blue'}} className="timecode">{firstWordTimeSec}s</button>

                      <div className = "editText">
                            <input type="text" id = "editTextBox" style={{display:'none'}}
                              onChange={this.textChange.bind(this)} onKeyPress={this.enterPressed.bind(this)}></input>
                      </div>

                      <div id="transcriptSnippets" contentEditable = "true" onInput={e => console.log('Text inside div', e.currentTarget.textContent)}>
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
