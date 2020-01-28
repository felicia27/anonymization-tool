import React, { useCallback, useContext } from "react";
import { withRouter, Redirect } from "react-router";
import app from "./base.js";
import { AuthContext } from "./Auth.js";
import { Input, Button, Typography } from "antd";
import './Login.css'

const { Title } = Typography;

const Login = ({ history }) => {
  const handleLogin = useCallback(
    async event => {
      event.preventDefault();
      const { email, password } = event.target.elements;
      console.log(email, password)
      try {
        await app
          .auth()
          .signInWithEmailAndPassword(email.value, password.value);
        history.push("/");
      } catch (error) {
        alert(error);
      }
    },
    [history]
  );

  const { currentUser } = useContext(AuthContext);

  if (currentUser) {
    return <Redirect to="/" />;
  }

  return (
    <div className="Login-container gradient-background">
      <form onSubmit={handleLogin} className="Login-form">
        <div className="Form-title">
          <Title level={4}>Login to Data Anonymization Tool</Title>
        </div>
        <div className="Form-email">
          <Input size="large" name="email" type="email" placeholder="Email" />
        </div>
        <div className="Form-password">
          <Input size="large" name="password" type="password" placeholder="Password" />
        </div>
        <div className="Form-submit">
          <Button type="primary" htmlType="submit">
            Log In
          </Button>
          {/* <button type="submit">Log in</button> */}
        </div>
      </form>
    </div>
  );
};

export default withRouter(Login);
