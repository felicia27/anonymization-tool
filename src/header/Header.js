import React, { Component } from 'react';
import './Header.css';
import { Button, Icon } from "antd";
import app from "../base";



class Header extends Component {
    constructor(props) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
      }

      handleClick() {
        console.log('Click happened');
      }

    render() {
        return (
            <div className="Header-container">
                <div className="Header-export">
                    <Button type="primary" onClick= {() => this.handleClick()}>
                        <Icon  type="arrow-left" />

                    </Button>
                </div>
                <div className="Header-logo">
                    <span>Data Anonymization Tool</span>
                </div>

                <div className="Header-signOut">
                    <Button type="primary" onClick={() => app.auth().signOut()}>
                        <Icon type="logout" />
                        Sign out
                    </Button>
                </div>


            </div>

        );
    }
}

export default Header;
