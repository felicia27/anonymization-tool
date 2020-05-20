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
      this.addDotToAudioPlayer();
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

    handleMessage = (project, audio, labels) => {
      var deleteCounter = 1;
      var censorCounter = 1;
      var deleteTimeCurrent = undefined;
      var censorTimeCurrent = undefined;
      var currentlyOn = "none";
      var deleteObject = {"numberOfInputs": 0};
      var censorObject = {"numberOfInputs": 0};
      let audioData = {};
      audioData["projectID"] = project;
      audioData["UUID"] = audio;
      audioData["email"] = this.props.audioEmail;
      console.log(audioData);


      for(var i = 0; i < labels.IDArray.length; i++){
        
        if(labels.IDArray[i].label == "DELETE" && deleteTimeCurrent === undefined && currentlyOn == "none"){
          deleteObject["numberOfInputs"] += 1;
          deleteTimeCurrent = labels.IDArray[i].startTime;
          deleteObject["startTime"+deleteCounter] = (deleteTimeCurrent/1000000000).toString();
          currentlyOn = "delete";
        }
        else if(labels.IDArray[i].label == "DELETE" && deleteTimeCurrent !== undefined && currentlyOn == "delete"){
          deleteTimeCurrent += labels.IDArray[i].endTime - labels.IDArray[i].startTime;
        }
        else if(labels.IDArray[i].label === undefined && deleteTimeCurrent !== undefined && currentlyOn == "delete"){
          deleteObject["endTime"+deleteCounter] = (deleteTimeCurrent/1000000000).toString();
          deleteCounter += 1;
          currentlyOn = "none";
          deleteTimeCurrent = undefined;
        }
        else if(labels.IDArray[i].label === "MASK" && deleteTimeCurrent !== undefined && currentlyOn == "delete"){
          deleteObject["endTime"+deleteCounter] = (deleteTimeCurrent/1000000000).toString();
          deleteCounter += 1;
          currentlyOn = "mask";
          deleteTimeCurrent = undefined;
          censorTimeCurrent = labels.IDArray[i].startTime;
          censorObject["startTime"+censorCounter] = (censorTimeCurrent/1000000000).toString();
          censorObject["numberOfInputs"] += 1;
        }
        else if(labels.IDArray[i].label == "MASK" && censorTimeCurrent === undefined && currentlyOn == "none"){
          censorObject["numberOfInputs"] += 1;
          censorTimeCurrent = labels.IDArray[i].startTime;
          censorObject["startTime"+censorCounter] = (censorTimeCurrent/1000000000).toString();
          currentlyOn = "mask";
        }
        else if(labels.IDArray[i].label == "MASK" && censorTimeCurrent !== undefined && currentlyOn == "mask"){
          censorTimeCurrent += labels.IDArray[i].endTime - labels.IDArray[i].startTime;
        }
        else if(labels.IDArray[i].label === undefined && censorTimeCurrent !== undefined && currentlyOn == "mask"){
          censorObject["endTime"+censorCounter] = (censorTimeCurrent/1000000000).toString();
          censorCounter += 1;
          currentlyOn = "none";
          censorTimeCurrent = undefined;
        }
        else if(labels.IDArray[i].label === "DELETE" && censorTimeCurrent !== undefined && currentlyOn == "mask"){
          deleteObject["numberOfInputs"] += 1;
          censorObject["endTime"+censorCounter] = (censorTimeCurrent/1000000000).toString();
          censorCounter += 1;
          currentlyOn = "delete";
          censorTimeCurrent = undefined;
          deleteTimeCurrent = labels.IDArray[i].startTime;
          deleteObject["startTime"+deleteCounter] = (deleteTimeCurrent/1000000000).toString();
        }
      }

      if(censorTimeCurrent !== undefined){
        censorObject["endTime"+censorCounter] = (censorTimeCurrent/1000000000).toString();
      }
      if(deleteTimeCurrent !== undefined){
        deleteObject["endTime"+deleteCounter] = (deleteTimeCurrent/1000000000).toString();
      }

      deleteObject["numberOfInputs"] = deleteObject["numberOfInputs"].toString();
      censorObject["numberOfInputs"] = censorObject["numberOfInputs"].toString();

      audioData["delete"] = JSON.stringify(deleteObject);
      audioData["censor"] = JSON.stringify(censorObject);
      
      let pubMessage = firebase.functions().httpsCallable('pubMessage');
      pubMessage({text: audioData});
  }

    processTranscript=()=>{
        let idTranscript = JSON.parse(this.props.idTranscript);
        idTranscript = interpolate(idTranscript);
        this.setState({
            IDArray: idTranscript,
        })
    }

    applyAudioEdits(){
      this.handleMessage(this.currentProject, this.currentAudio, this.state);
      var currTran = this.state.IDArray;
      var deletePositions = []
      currTran.forEach(function(part, index){
          if (this[index].label == "DELETE"){
              deletePositions.push(index);
          }

      },currTran);


      for (var i in deletePositions){
          var duration = currTran[deletePositions[i]].endTime - currTran[deletePositions[i]].startTime;

          currTran.forEach(function(part, index){
              if (index == deletePositions[i]){
                  this[index].startTime = 0;
                  this[index].endTime = 0;
              }
              else if (index > deletePositions[i]){
                   this[index].startTime -= duration;
                   this[index].endTime -= duration;
              }

          }, currTran);

      }
      var nextChange = this.state.change;

      this.setState({
        IDArray: currTran,
        change: nextChange+= 1,
      });
      

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
      }

      this.labelDict = {"Delete": [], "Mask": [], "Edit": []};
      var nextChange = this.state.change;
      this.setState({
        IDArray: currentidTranscript,
        change: nextChange+= 1,
      });
      this.db = firebase.firestore();
      this.docUser.collection("projects").doc(this.currentProject).collection("audios").doc(this.currentAudio).set( {
        idTranscript: JSON.stringify(currentidTranscript),
      }, { merge: true });
      this.refs.Save.Saved();
    }

     onMouseUpHandler = (e) =>{
       console.log("on mouse up calling")
       var event = window.event;
       this.getSelectionText(e);
       this.displayMenu(event);

       this.recordDict(event);
      //  this.addDotToAudioPlayer();
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
        text = text.replace(/\u00a0/g, " ")
        text = text.replace(/  +/g, " ");
        var splitted = text.trim().split(" ");
        var newTrans = alignWords(currentidTranscript, splitted);
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
        }
      }

      highlightText(event) {
        var range = window.getSelection().getRangeAt(0);
        if (this.getLabelSelection(event) == "Mask"){

            //var selectionContents = range.extractContents();
            for (var id in spanID){
              var span = document.getElementById(spanID[id]);
              console.log("SPAN", span);
              span.style.backgroundColor = "lightblue";
            }
          }
        else if (this.getLabelSelection(event) == "Delete"){
              //var selectionContents = range.extractContents();
              var strikeALL = true;
              for (var id in spanID){
                var span = document.getElementById(spanID[id]);
                if (span.style.textDecoration == "line-through"){
                  strikeALL = false;
                }
              }
              const currentidTranscript = this.state.IDArray;
              for (var id in spanID){
                var span = document.getElementById(spanID[id]);
                if (strikeALL == false){
                  this.deleteFromDB("Delete", spanID[id], currentidTranscript);
                  console.log("DESPAN", span.innerText)
                  span.style.textDecoration = "none";
                }
                else{
                  console.log("SPAN", span.innerText)
                  span.style.textDecoration = "line-through";
                }
              }
              if (strikeALL == false){
                console.log(currentidTranscript);
                var nextChange = this.state.change;
                this.setState({
                  IDArray: currentidTranscript,
                  change: nextChange+= 1,
                });
              }
        }
    }
    deleteFromDB(type, id, trans){
      if (type == "Delete"){
          console.log(id)

          if ("label" in trans[id] && trans[id].label == "DELETE"){
            console.log("DELETING")
            console.log(trans[id])
            console.log(trans[id])
            trans[id].label = "HOOGLY";
            console.log(trans)
            console.log(trans[id])
          }
      }
    console.log(trans);
    return trans;
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
        console.log(label.toString());
        return label.toString()
      }

      displayMaskLabel(event){
        var x = event.pageX;
        var y = event.pageY;
        y -=450;
        var label_container = document.createElement('div');
        label_container.className = 'label_container';
        label_container.style.float = 'left';
        label_container.style.position = 'sticky';
        label_container.style.top = (y).toString() + 'px'
        label_container.innerHTML = `<span class="label mask">Mask</span>`;
        document.getElementsByClassName('column')[0].appendChild(label_container);
        document.getElementById("labelSelect").style.display = 'none';
      }

      updateMaskLabel(x, y){
        y -=450;
        var label_container = document.createElement('div');
        label_container.className = 'label_container';
        label_container.style.float = 'left';
        label_container.style.position = 'sticky';
        label_container.style.top = (y).toString() + 'px'
        label_container.innerHTML = `<span class="label mask">Mask</span>`;
        document.getElementsByClassName('column')[0].appendChild(label_container);
        document.getElementById("labelSelect").style.display = 'none';
      }

      recordDict(event) {
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

        else if (this.getLabelSelection(event) === "Delete" && userSelectText !== "") {
          console.log("DELETING")
          var x = event.pageX;
          var y = event.pageY;
          for (var word of spanID) {
            var templabelDict = this.labelDict;
            templabelDict["Delete"].push([word]);
            this.labelDict = templabelDict;
          }
          spanID = [];
          userSelectText = "";
          this.SaveChanges();
        }
        else if (this.getLabelSelection(event) === "Mask" && userSelectText !== "") {
          console.log("MASKING")
          var x = event.pageX;
          var y = event.pageY;
          for (var word of spanID) {
            var templabelDict = this.labelDict;
            templabelDict["Mask"].push([word, x, y]);
            var newChange = this.state.change;
            this.labelDict = templabelDict;
          };
          this.displayMaskLabel(event);
          userSelectText = "";
          spanID = [];
          this.SaveChanges();
          this.addDotToAudioPlayer();
        }
    }

    highlightNextText(id){
      this.currentPlay = id

      if (this.currentPlay < this.state.IDArray.length-1){
        for(var i=0;i<this.state.IDArray.length;i++){
          document.getElementById(this.currentPlay).style.fontWeight = 'bold';
        }
        //this.setState.currentPlay += 1;
        //document.getElementById(this.currentPlay + 1).style.fontWeight = 'normal';
        var temp = this.currentPlay + 1;
        this.setState({dummy: temp,});
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
      var Stamp = document.getElementById("timeStamp");
      Stamp.style.color = 'lightgreen';
    };

    addDotToAudioPlayer = ()=>{
      console.log("TRANSCRIPT")
      this.props.addDots(this.state.IDArray);
      console.log(this.state.IDArray)

    };


    // addDotToAudioPlayer() {
    //   console.log("clicked")
    //   for (var number in this.state.IDArray) {
    //     if (this.state.IDArray[number]["label"] === "MASK") {
    //       console.log(this.state.IDArray[number]["startTime"])
    //     }
    //   }
    //   console.log("IDARRAY", this.state.IDArray)
    // }



    render() {

      // {this.addDotToAudioPlayer()}

        let transcriptSnippets = this.state.IDArray.map((word, index) => {

            if (!('label' in word))
            {
              return (
                      <span id={index} key={index} className="Transcript-transcription-text"  onMouseUp={this.onMouseUpHandler.bind(this)}>{word["word"]}&nbsp;</span>
              );
            }
            else if (word["label"] == "MASK") {
              this.updateMaskLabel(word["x"], word["y"]);
              return (
                      <span id={index} key= {index} className="Transcript-transcription-text" style = {{backgroundColor: "lightblue"}} onMouseUp={this.onMouseUpHandler.bind(this)}>{word["word"]}&nbsp;</span>
              );
            }
            else if (word["label"] == "DELETE") {

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
                      <label onClick={this.applyAudioEdits.bind(this)} style={{backgroundColor: "#1890ff", color: 'white', padding: 8, borderRadius: 4, cursor: 'pointer', position: "absolute", right: 0, fontSize:14, bottom: 385}}>
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
                  <div ref = {node => this.node = node} onMouseUp={this.onMouseUpHandler.bind(this)} id="labelSelect" className="labelSelect-content">
                    <a id="Mask">Mask</a>
                    <a id="Delete">Delete</a>
                    <a id="Play">Play</a>
                  </div>
                </div>
                <section className="clear utterance_container">
                  <div className="content_container clear">
                    <div className="speaker">
                      <select style={{width: '100px', position: 'sticky'}} onchange="this.nextElementSibling.value=this.value">
                        <option>Speaker 1</option>
                        <option> Speaker 2</option>
                      </select>
                      <input style={{width: '70px', marginTop: '1px', border: 'none', position: 'sticky', right: 124, marginRight: '25px'}} defaultValue="Speaker 1" />
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
