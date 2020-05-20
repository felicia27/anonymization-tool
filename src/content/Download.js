
import React, { Component } from 'react';
import "./Download.css"

class Download extends Component {

    constructor(props) {
        super(props);
        this.state = {
          display:false,
        }
    }
    SetDisplayTrue(){
     console.log("HELL YEA dispalying");

      this.setState({
        display: true,
      })
     }
     SetDisplayFalse(){
      console.log("HELL YEA undispalying");

       this.setState({
         display: false,
       })
      }


    render(){
      return (
        <div className = "Transcript-Download" id = "download">


        {this.state.display && <div>
            <form>
                <label  onClick={this.props.downloadLink} style={{backgroundColor: "red", display: "block", color: 'white', padding: 8, borderRadius: 4, cursor: 'pointer', position: "absolute", right: 0, fontSize: 14, bottom: 305}}>
                    Download
                </label>
            </form>
        </div>
        }

        </div>
      )
    }
}

export default Download;
