// import firebase from "firebase";
import { Typography } from "antd";
import React, { Component } from 'react';
import firebase from "firebase";
import './Transcript.css'
import "./edit.css"
import { Icon } from "antd";
import rangy from "rangy";
import Save from "./savingBar.js"
import {alignWords, interpolate} from "./EditTrans.js"
const { Text, Title } = Typography;
const punctuation = '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';
var userSelectText = "";
var spanID = [];


class Transcript extends Component {

    constructor(props) {
        super(props);
        this.state = {
            IDArray: [],
            update:0,
            dummy: 0,
            editedText: "",
            change:0,
            saving: false,
            saved: false,
        };
        this.currentPlay=0;
        this.labelDict = {"Delete": [], "Mask": [], "Edit":[]};
        //this.currentPlay = 0;
        this.timeout = 0;

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
    shouldComponentUpdate(nextProps, nextState){
      if (this.state.change != nextState.change){
        return false
      }
      return true
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
       // console.log(idTranscript)
        idTranscript = interpolate(idTranscript);
        this.setState({
            IDArray: idTranscript,
        })
    }

    SaveChanges(){
      this.refs.Save.Saving();
      var maskDict = this.labelDict["Mask"];
      var delDict = this.labelDict["Delete"];
      var currentidTranscript = this.state.IDArray;

      for(let i = 0 ; i < maskDict.length; i++) {
         let elMasked = maskDict[i][0];
         currentidTranscript[elMasked]["label"] = "MASK";
         currentidTranscript[elMasked]["x"] = maskDict[i][1];
         currentidTranscript[elMasked]["y"] = maskDict[i][2];
      }
      for(let i = 0 ; i < delDict.length; i++) {
        let elMasked = delDict[i][0];
        currentidTranscript[elMasked]["label"] = "DELETE";
        currentidTranscript[elMasked]["x"] = delDict[i][1];
        currentidTranscript[elMasked]["y"] = delDict[i][2];
      }
      this.labelDict = {"Delete": [], "Mask": [], "Edit": []};
      var nextChange = this.state.change;
     // console.log(currentidTranscript);
     console.log(currentidTranscript);
      this.setState({

        IDArray: currentidTranscript,
        change: nextChange+= 1,
      });
      this.db = firebase.firestore();
      // this.docUser.collection("projects").doc(this.currentProject).collection("audios").doc(this.currentAudio).set( {
      //   idTranscript: JSON.stringify(currentidTranscript),
      // }, { merge: true });
      this.refs.Save.Saved();
    }

     onMouseUpHandler = (e) =>{
       var event = window.event;
       this.getSelectionText(e);
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
    updateText(){

       // console.log("typing");
        var duration = 2000;

        clearTimeout(this.timeout);

        this.timeout = setTimeout(()=>{
          this.updateTranscriptToDB()}, duration);
      }
    updateTranscriptToDB(){
        this.refs.Save.Saving();

        var currentidTranscript = this.state.IDArray;
        var contenteditable = document.querySelector('[contenteditable]');
        var text = contenteditable.textContent;
     //   console.log(text);
        text = text.replace(/\u00a0/g, " ")
        text = text.replace(/  +/g, " ");
        var splitted = text.trim().split(" ");
        var newTrans = alignWords(currentidTranscript, splitted);
       // console.log(newTrans);
        this.db = firebase.firestore();
        this.docUser.collection("projects").doc(this.currentProject).collection("audios").doc(this.currentAudio).set( {
          idTranscript: JSON.stringify(newTrans),
        }, { merge: true });

        var nextChange = this.state.change;
        this.setState({

          IDArray: newTrans,
          change: nextChange+= 1,
        });
        this.refs.Save.Saved();

    }


    getSelectedSpanIds() {
      var sel = rangy.getSelection(), ids = [];
      for (var r = 0, range, spans; r < sel.rangeCount; ++r) {
          range = sel.getRangeAt(r);
          if (range.startContainer == range.endContainer && range.startContainer.nodeType == 3) {
              range = range.cloneRange();
              range.selectNode(range.startContainer.parentNode);
          }
          spans = range.getNodes([1], function(node) {
                return node.nodeName.toLowerCase() == "span";
          });
          for (var i = 0, len = spans.length; i < len; ++i) {
              ids.push(parseInt(spans[i].id));
          }
      }
      return ids;
    }

      getSelectionText(e) {
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

          spanID = this.getSelectedSpanIds();
           //console.log(userSelectText);
           //console.log(spanID);
        }
      }

      highlightText(event) {
        var range = window.getSelection().getRangeAt(0);

        if (this.getLabelSelection(event) == "Mask"){
          console.log("MASK SELECTED")
            //var selectionContents = range.extractContents();
            for (var id in spanID){

              var span = document.getElementById(spanID[id]);
              console.log("SPAN", span);
              span.style.backgroundColor = "lightblue";
            }
          }

        else if (this.getLabelSelection(event) == "Delete"){
              console.log("DELETE SELECTED")
              //var selectionContents = range.extractContents();
              var strikeALL = true;
              for (var id in spanID){
                var span = document.getElementById(spanID[id]);
                if (span.style.textDecoration == "line-through"){
                  strikeALL = false;
                }
              }

              for (var id in spanID){
                console.log(spanID[id])
                var span = document.getElementById(spanID[id]);
                if (strikeALL == false){
                  var span = document.getElementById(spanID[id]);
                  console.log("DESPAN", span.innerText)
                  span.style.textDecoration = "none";
                }
                else{
                  console.log("SPAN", span.innerText)
                  span.style.textDecoration = "line-through";
                }

              }
              this.displayDeleteLabel(event);



            }
    }


      displayMenu(event){
        if (userSelectText != ""){
          var x = event.pageX;
          var y = event.pageY;
          var menu = document.getElementById("labelSelect");
          menu.style.display = "block";
          menu.style.position = 'absolute';
          menu.style.margin = (y-300)+"px 0px 0px " +(x+30)+"px";
      }
      }

      getLabelSelection(event){
        var label = event.target.id;
        return label.toString()
      }

      displayDeleteLabel(event){
        console.log("PRINTING");
        var x = event.pageX;
        var y = event.pageY;

        var label_container = document.createElement('div');
        label_container.className = 'label_container';
        label_container.style.float = 'left';
        label_container.style.position = 'absolute';
        label_container.style.top = (y).toString() + 'px'
        label_container.innerHTML = `<span class="label delete">Delete</span>`;
        document.getElementsByClassName('column')[0].appendChild(label_container);
        document.getElementById("labelSelect").style.display = 'none';
      }

      updateDeleteLabel(x,y){

        
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
        y += 50;
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
        y += 150;
        var label_container = document.createElement('div');
        label_container.className = 'label_container';
        label_container.style.float = 'left';
        label_container.style.position = 'absolute';
        label_container.style.top = (y).toString() + 'px'
        label_container.innerHTML = `<span class="label mask">Mask</span>`;
        document.getElementsByClassName('column')[0].appendChild(label_container);
        document.getElementById("labelSelect").style.display = 'none';
      }

      recordDict(event) {
        // if (userSelectText !== ""){
        //   var wordIDs = userSelectText.match(/\d+/g).map(Number);
        // }

        if (this.getLabelSelection(event) === "Play" && userSelectText !== ""){
           var start = this.state.IDArray[spanID[0]].startTime;
           var end = this.state.IDArray[spanID[spanID.length-1]].endTime;

           this.currentPlay = spanID[0];
           this.props.play_audio(start,end, this.currentPlay);
           // this.setState({
           //        currentPlay: spanID[0],
           //    })
           //this.currentPlay = spanID[0];
           //document.getElementById(this.currentPlay).style.fontWeight='bold';
           document.getElementById("labelSelect").style.display = 'none';
        }
        if (this.getLabelSelection(event) === "Delete" && userSelectText !== "") {
          var x = event.pageX;
          var y = event.pageY;
          for (var word of spanID) {

            var templabelDict = this.labelDict;
            templabelDict["Delete"].push([word, x, y]);
            this.labelDict = templabelDict;
          }

          spanID = [];
          userSelectText = "";
          this.SaveChanges();
        }
        else if (this.getLabelSelection(event) === "Mask" && userSelectText !== "") {

          var x = event.pageX;
          var y = event.pageY;
          for (var word of spanID) {
            var templabelDict = this.labelDict;
            templabelDict["Mask"].push([word, x, y]);
            var newChange = this.state.change;
            this.labelDict = templabelDict;
            // console.log(this.labelDict)
          };

          this.displayMaskLabel(event);
          userSelectText = "";
          spanID = [];
          this.SaveChanges();
        }
        //console.log(JSON.stringify(this.state.labelDict));
    }

    highlightNextText(id){
    //  console.log("highlighting next text")
      this.currentPlay = id
     // console.log(this.state.IDArray.length-1);
    //  console.log(this.currentPlay);
      if (this.currentPlay < this.state.IDArray.length-1){
        for(var i=0;i<this.state.IDArray.length;i++){
          document.getElementById(this.currentPlay).style.fontWeight = 'bold';
        }
        //this.setState.currentPlay += 1;

        //document.getElementById(this.currentPlay + 1).style.fontWeight = 'normal';
        var temp = this.currentPlay + 1;
        this.setState({
               dummy: temp,
           })

        this.props.readyForNext(this.state.IDArray[temp].endTime, temp);
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
   //   console.log("pressed");
      var Stamp = document.getElementById("timeStamp");
      Stamp.style.color = 'lightgreen';

    };

    render() {

        let transcriptSnippets = this.state.IDArray.map((word, index) => {
            if (!('label' in word))
            {
          //    console.log(word.word)
              return (

                      <span id={index} key={index} className="Transcript-transcription-text"  onMouseUp={this.onMouseUpHandler.bind(this)}>{word["word"]}&nbsp;</span>

              );
            }
            if (word["label"] == "MASK") {
              this.updateMaskLabel(word["x"], word["y"]);
              return (

                      <span id={index} key= {index} className="Transcript-transcription-text" style = {{backgroundColor: "lightblue"}} onMouseUp={this.onMouseUpHandler.bind(this)}>{word["word"]}&nbsp;</span>

              );
            }
            if (word["label"] == "DELETE") {
              this.updateDeleteLabel(word["x"], word["y"]);
              return (

                      <span id={index} key= {index} className="Transcript-transcription-text" style = {{textDecoration: "line-through"}} onMouseUp={this.onMouseUpHandler.bind(this)}>{word["word"]}&nbsp;</span>

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
                      <label onClick={this.SaveChanges.bind(this)} style={{backgroundColor: "#1890ff", color: 'white', padding: 8, borderRadius: 4, cursor: 'pointer', position: "absolute", right: 0, fontSize:14, bottom: 385}}>
                          <Icon  style={{paddingRight: "10px"}} type="save" />
                          Apply Audio Edits
                      </label>
                  </form>
                  <form>
                    <Save ref ="Save" onRef={ref => (this.Save = ref)}/>
                  </form>
              </div>


            <div className="transcript_container clear" style = {{width:1300}}>
            <div className="column" style={{marginRight:-140, overflow: "hidden"}}></div>
              <div className="transcript">

                <div className="labels">
                  <div ref = {node => this.node = node} onMouseUp={this.onMouseUpHandler} id="labelSelect" className="labelSelect-content">
                    <a id="Delete">Delete</a>
                    <a id="Mask">Mask</a>
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



                      <div id="transcriptSnippets" contentEditable = "true" onInput={this.updateText.bind(this)}>
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
