import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Chart from './containers/Chart';
import List from './containers/List';
import registerServiceWorker from './registerServiceWorker';

import {Router, Route, browserHistory} from "react-router";

const Root = () => (
<Router history={browserHistory}>
  <Route  >
    <Route path={"/"} component={List}/>
    <Route path={"/:base-:quote"} component={Chart}/>
  </Route>
</Router>
);

ReactDOM.render(<Root />, document.getElementById('root'));
registerServiceWorker();
