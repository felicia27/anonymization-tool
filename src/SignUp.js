import React, { useCallback } from "react";
import { withRouter } from "react-router";
import app from "./base";
import "./SignUp.css"
import { Input, Button, Typography } from "antd";

const { Title } = Typography;

const SignUp = ({ history }) => {
  const handleSignUp = useCallback(async event => {
    event.preventDefault();
    const { email, password } = event.target.elements;
    try {
      await app
        .auth()
        .createUserWithEmailAndPassword(email.value, password.value);
      history.push("/");
    } catch (error) {
      alert(error);
    }
  }, [history]);

  return (
    <div className="SignUp-container SignUp-gradient-background">
      <form onSubmit={handleSignUp} className="SignUp-form">
        <div className="Form-title">
          <Title level={4}>SignUp to Data Anonymization Tool</Title>
        </div>
        <div className="Form-email">
          <Input size="large" name="email" type="email" placeholder="Email" />
        </div>
        <div className="Form-password">
          <Input size="large" name="password" type="password" placeholder="Password" />
        </div>
        <div className="Form-submit">
          <Button type="primary" htmlType="submit">Sign Up</Button>
        </div>
      </form>
    </div>
  );
};

export default withRouter(SignUp);
