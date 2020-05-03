import React from "react";
import "./App.css";
import { Link, BrowserRouter as Router, Route } from "react-router-dom";
import Projects from "./Projects";
import Audios from "./Audios";
import Home from "./Home";
import Login from "./Login";
import SignUp from "./SignUp";
import Test from "./StaticHome"
import { AuthProvider } from "./Auth";
import PrivateRoute from "./PrivateRoute";

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <PrivateRoute exact path="/home" component={Home} />
          <PrivateRoute exact path = "/" component={Test} />
          <PrivateRoute exact path="/projects" component={Projects} />
          
          <Route exact path="/login" component={Login} />
          <Route exact path="/signup" component={SignUp} />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
