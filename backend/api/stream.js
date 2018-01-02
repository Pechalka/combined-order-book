var exchanges = {};


var gdax = require('../connectors/gdax');
var bitfinex = require('../connectors/bitfinex');

var connectors = {
    gdax: gdax,
    bitfinex: bitfinex
};

function subscribe(io){
    return function(data) {
        console.log('subscribe', data);
        var exchange = data.exchange;
        var pair = data.pair;
        var key = pair + exchange;
        if (!exchanges[key]) {
        	exchanges[key] = 1;
            
            connectors[exchange].subscribe(function(data) {
                io.emit('orderbook_' + exchange + '_' + pair, data);
            }, pair, 100)
        }
    }
}

module.exports = {
    subscribe: subscribe
}
