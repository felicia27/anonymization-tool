import React from "react";
import "./App.css";
import { BrowserRouter as Router, Route } from "react-router-dom";
import Projects from "./Projects";
import Audios from "./Audios";
import Home from "./Home";
import Login from "./Login";
import SignUp from "./SignUp";
import { AuthProvider } from "./Auth";
import PrivateRoute from "./PrivateRoute";

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <PrivateRoute exact path="/" component={Home} />
          <PrivateRoute exact path = "/projects" component={Projects} />
          <PrivateRoute exact path="/audios" component={Audios} />
          <Route exact path="/login" component={Login} />
          <Route exact path="/signup" component={SignUp} />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
