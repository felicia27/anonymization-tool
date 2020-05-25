import { Typography } from "antd";
import React, { Component } from 'react';
import "./savingBar.css"

class Save extends Component {

    constructor(props) {
        super(props);
        this.state = {
          saving: false,
          saved: false,
        }
    }
    Saving(){
      //console.log("HELL YEA SAVING");
      this.setState({
        saving: true,
        saved: false
      });
    }
    Saved(){
     // console.log("HELL YEA SAVING");
      setTimeout(()=>{
        this.setState({
          saving: false,
          saved: true
        })}, 3000);
     }


    render(){
      return (

        <div className="saving-progress">
        {this.state.saving && <div className="savingBar"><span>Saving...</span></div>}
        {this.state.saved && <div className="saving-fade-animation">Saved!</div>}
        </div>
      )
    }
}

export default Save;
