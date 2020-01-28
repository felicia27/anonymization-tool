import React, { Component } from 'react';
import './Header.css';
import { Button, Icon } from "antd";
import app from "../base";

class Header extends Component {
    render() {
        return (
            <div className="Header-container">
                <div className="Header-logo">
                    <span>Data Anonymization Tool</span>
                </div>

                <div className="Header-about">
                    {/* This is not the right way to use anchor <a>, add value to href later and remove onClick*/}
                    <a href="#/" onClick={() => {return false}}>About</a>
                </div>

                <div className="Header-contact">
                    <a href="#/" onClick={() => {return false}}>Contact</a>
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