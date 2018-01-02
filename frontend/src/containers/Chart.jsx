import React, { Component } from 'react';
import withRouter from "react-router/es/withRouter";
import openSocket from 'socket.io-client';

import _ from 'lodash';

var numeral = require('numeral');

const {AreaChart, Area, XAxis, YAxis, Tooltip} = require('recharts');

function tickFormatter(v) {
  return numeral(v).format('0,0.00')
}
const colors = ['#8884d8', '#82ca9d'];
const SimpleAreaChart = ({ data, fields, reversed = false, hide=false }) => {
  return (
    <AreaChart width={600} height={400} data={data} >
      <XAxis dataKey="price" reversed={reversed} tickFormatter={tickFormatter} />
      <YAxis hide={hide}/>
      <Tooltip/>
      {fields.map((field, index) => (
        <Area 
          type='stepAfter' 
          stackId="1" 
          key={field} 
          dataKey={field} 
          stroke={colors[index]} 
          fill={colors[index]} 
        />
      ))}
    </AreaChart>
  );
}


function processDataAsk(exchanges) {

  let asks = [];

  for(let key in exchanges) {
    asks = asks.concat(exchanges[key].asks);
  }
  
  if (asks.length === 0) return [];

  const max = _.maxBy(asks, 'price').price;
  const min = _.minBy(asks, 'price').price;

  let step = (max - min) / 100;
  
  const results = [];
  for(let p = min; p <= max; p += step) {
    const chartItem = {
      price: p
    }
    for(let key in exchanges) {
      const items = exchanges[key].asks.filter(item => item.price <= p);
      chartItem[key] = items.reduce((a, b) => a + b.totalSize, 0);
    }
    results.push(chartItem);    
  }

  return results;
}


function processDataBid(exchanges) {

  let bids = [];

  for(let key in exchanges) {
    bids = bids.concat(exchanges[key].bids);
  }
  
  if (bids.length === 0) return [];

  const max = _.maxBy(bids, 'price').price;
  const min = _.minBy(bids, 'price').price;

  let step = (max - min) / 100;
  
  const result = [];
  for(let p = max; p >= min  && step > 0; p -= step) {
    const chartItem = {
      price: p
    }
    for(let key in exchanges) {
      const items = exchanges[key].bids.filter(item => item.price > p);
      chartItem[key] = items.reduce((a, b) => a + b.totalSize, 0);
    }
    result.push(chartItem)
  }

  return result;
}

function initState(exchanges) {
  const state = {};
  for(let i = 0; i < exchanges.length; i++){
    const market = exchanges[i];
    state[market] = {
        bids: [],
        asks: []      
    }
  }
  return state;
}

class Chart extends Component {
  constructor(props) {
    super(props);
    this.state = initState(['gdax', 'bitfinex']);

    this.subscribeToExchange = this.subscribeToExchange.bind(this); 
  }

  subscribeToExchange(pair, exchange) {
    this.socket.emit('subscribe', { pair, exchange });
    this.socket.on(`orderbook_${exchange}_${pair}`, data => {
      this.setState({
        [exchange]: data
      })
    });
  }

  componentDidMount() {
    const {
      base, quote
    } = this.props.routeParams;
    this.socket = openSocket('http://localhost:4000');

    const pair = `${base}-${quote}`;
    this.subscribeToExchange(pair, 'gdax');
    this.subscribeToExchange(pair, 'bitfinex');
  }
  componentWillUnmount() {
    this.socket.close();
  }
  render() {
    const asks = processDataAsk(this.state)
    const bids = processDataBid(this.state);

    return (
      <div className="App">
        <div style={{ display: 'flex' }}>
          <div>
            bilds
            <SimpleAreaChart data={bids} fields={['gdax', 'bitfinex']}  reversed={true}/>
          </div>
          <div>
            asks
            <SimpleAreaChart data={asks} fields={['gdax', 'bitfinex']} hide={true} />            
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(Chart);
