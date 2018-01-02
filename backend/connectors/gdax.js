// import GTT from 'gdax-trading-toolkit';
var GTT = require('gdax-trading-toolkit');
var { LiveBookConfig, LiveOrderbook, SkippedMessageEvent, TradeMessage } = require("gdax-trading-toolkit/build/src/core");

const logger = GTT.utils.ConsoleLoggerFactory({ level: 'info' });
const printOrderbook = GTT.utils.printOrderbook;
const printTicker = GTT.utils.printTicker;

let tradeVolume = 0;




function padfloat(val, total, decimals) {
    const str = (+val).toFixed(decimals);
    const padLen = total - str.length;
    let result = '';
    for (let i = 0; i < padLen; i++) {
        result += ' ';
    }
    return result + str;
}

function toJSON(book, numOrders = 20, basePrec = 4, quotePrec = 2) {
    const state = book.state();
    const report = {
        id: state.sequence,
        bids: [],
        asks: []
    }
    // let report = `\n\n Orderbook ${state.sequence}\n`;
    if (state.bids.length < numOrders) {
        return report;
    }
    let totalAsks = 0;
    let totalBids = 0;
    for (let i = 0; i < numOrders; i++) {
        const bid = state.bids[i];
        const ask = state.asks[i];
        totalAsks += +ask.totalSize;
        totalBids += +bid.totalSize;

        report.bids.push({
            totalBids: totalBids, //padfloat(totalBids, 9, basePrec),
            totalSize: +bid.totalSize, //padfloat(bid.totalSize, 8, basePrec),
            price: +bid.price, //padfloat(bid.price, 7, quotePrec)
        })

        report.asks.push({
            price: +ask.price, //padfloat(ask.price, 7, quotePrec),
            totalSize: +ask.totalSize, //padfloat(ask.totalSize, 8, basePrec),
            totalAsks: totalAsks, //padfloat(totalAsks, 9, basePrec)
        })
        // report += (`${padfloat(totalBids, 9, basePrec)}  ${padfloat(bid.totalSize, 8, basePrec)}  ${padfloat(bid.price, 7, quotePrec)}\t\t` +
        // `${padfloat(ask.price, 7, quotePrec)}  ${padfloat(ask.totalSize, 8, basePrec)}  ${padfloat(totalAsks, 9, basePrec)}\n`);
    }
    return report;

}



function subscribe(cb, product = 'BTC-USD', orderCount = 10, interval = 5000) {
// const product = 'BTC-USD';
    GTT.Factories.GDAX.FeedFactory(logger, [product]).then((feed) => {
        const config = {
            product: product,
            logger: logger
        };

        const book = new LiveOrderbook(config);

        book.on('LiveOrderbook.snapshot', () => {
            // logger.log('info', 'Snapshot received by LiveOrderbook Demo');
            setInterval(() => {
                cb(toJSON(book, orderCount));
                // console.log(printOrderbook(book, 10));
                // printOrderbookStats(book);
                // logger.log('info', `Cumulative trade volume: ${tradeVolume.toFixed(4)}`);
            }, interval);
        });

        // book.on('LiveOrderbook.ticker', (ticker) => {
        //     console.log(printTicker(ticker));
        // });

        book.on('LiveOrderbook.trade', (trade) => {
            tradeVolume += +(trade.size);
        });
        book.on('LiveOrderbook.skippedMessage', (details) => {
            // On GDAX, this event should never be emitted, but we put it here for completeness
            console.log('SKIPPED MESSAGE', details);
            console.log('Reconnecting to feed');
            feed.reconnect(0);
        });
        book.on('end', () => {
            console.log('Orderbook closed');
        });
        book.on('error', (err) => {
            console.log('Livebook errored: ', err);
            feed.pipe(book);
        });

        feed.pipe(book);
    })
}

module.exports = {
    subscribe
}

// function printOrderbookStats(book) {
//     console.log(`Number of bids:       \t${book.numBids}\tasks: ${book.numAsks}`);
//     console.log(`Total ${book.baseCurrency} liquidity: \t${book.bidsTotal.toFixed(3)}\tasks: ${book.asksTotal.toFixed(3)}`);
//     let orders = book.ordersForValue('buy', 100, false);
//     console.log(`Cost of buying 100 ${book.baseCurrency}: ${orders[orders.length - 1].cumValue.toFixed(2)} ${book.quoteCurrency}`);
//     orders = book.ordersForValue('sell', 1000, true);
//     console.log(`Need to sell ${orders[orders.length - 1].cumSize.toFixed(3)} ${book.baseCurrency} to get 1000 ${book.quoteCurrency}`);
// }