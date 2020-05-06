import React, { Component } from 'react';
import './Header.css';
import { Button, Icon } from "antd";
import app from "../base";
import { Link, BrowserRouter as Router, Route } from "react-router-dom";



class Header extends Component {
    constructor(props) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
      }

      handleClick() {
        console.log("redirecting");
        window.location.href="localhost:3000";
      }

    render() {
        return (
            <div className="Header-container">
                <div className="Header-export">
                 <Link to={"/"}>

                    <Button type="primary" onClick= {() => this.handleClick()}>
                        <Icon  type="arrow-left" />

                    </Button>
                </Link>
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
