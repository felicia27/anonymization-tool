import React, { Component } from 'react';
import { Icon } from "antd";
import "./alert.css"

class Alert extends Component {

    constructor(props) {
        super(props);
        this.state = {
          display:false,
          backColor: '#2D88F3',
          text: "Audio file is processing, please come back later.",
        }
    }
    showBannerWait(){
      console.log("wait");

      this.setState({
        display: true,
        text: "Audio file is processing, please come back later.",
        backColor: '#2D88F3',
      })
     }

     showBannerSuccess(){
      console.log("success");

       this.setState({
         display: true,
         text: "'Sucess! Your file is now ready to be downloaded'",
         backColor: "lightgreen",
       })
      }


    render(){
      return (
        <div className = "Transcript-Download" id = "download">


        {this.state.display && <div class="alert" id = "alert" style={{backgroundColor: this.state.backColor}}>
            <span class="closebtn"  onClick="this.parentElement.style.display='none';">&times;</span>
            {this.state.text}
        </div>
        }

        </div>
      )
    }
}

export default Alert;
