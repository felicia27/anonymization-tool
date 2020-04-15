import React, { useContext } from "react";
import { Route, Redirect } from "react-router-dom";
import { AuthContext } from "./Auth";

const PrivateRoute = ({ component: RouteComponent, ...rest }) => {
  const {currentUser} = useContext(AuthContext);
  /*
  //This commented section is for testing purposes
  console.log(currentUser, {...rest});
  
  if(!!currentUser) {
    console.log('1');
    return(<Route {...rest} render={ routeProps => <RouteComponent {...routeProps} />} />);
  }
  else {
    console.log('2');
    return(<Redirect to = {"/login"}/>);
  }*/

  
  return (
    <Route
      {...rest}
      render={routeProps =>
        !!currentUser ? (
          <RouteComponent {...routeProps} />
        ) : (
          <Redirect to={"/login"} />
        )
      }
    />
  );
};


export default PrivateRoute