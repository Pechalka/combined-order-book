const BFX = require('bitfinex-api-node')

const API_KEY = 'secret'
const API_SECRET = 'secret'
const opts = { version: 2, transform: true }
const bws = new BFX(API_KEY, API_SECRET, opts).ws;

const _ = require('lodash');

// ES 6 Map would be also possible
const orderbooks = {}; 
// {
//   bid: {},
//   ask: {}
// }

function start(cb, orderCount, product) {
  // console.log('start order book', bws)

 //  bws.on('open', () => {
	// console.log('open connection with bitfinex', product.replace('-', ''))
 //    bws.subscribeOrderBook(product.replace('-', ''), 'P0', orderCount)
 //  })

  bws.subscribeOrderBook(product.replace('-', ''), 'P0', orderCount)


  bws.on('orderbook', (pair, rec) => {
    // console.log('>>', pair, rec)
    if (!orderbooks[pair]) {
      orderbooks[pair] = {
        bid: {},
        ask: {}
      }
    }
    updateOrderbook(orderbooks[pair], rec, pair, cb, product)
  })

  bws.on('error', (e)=>{
    console.log('error ', e)
  } );
}

function isSnapshot (data) {
  return Array.isArray(data)
}

// Trading: if AMOUNT > 0 then bid else ask;
// Funding: if AMOUNT < 0 then bid else ask;
function bidOrAsk (el, type = 't') {
  if (type === 't' && el.AMOUNT > 0) { return 'bid' }
  if (type === 't' && el.AMOUNT < 0) { return 'ask' }

  if (type === 'f' && el.AMOUNT > 0) { return 'ask' }
  if (type === 'f' && el.AMOUNT < 0) { return 'bid' }

  throw new Error('unknown type')
}

function getType (pair) {
  return pair[0]
}

function updateOrderbook(orderbook, rec, pair, cb, product) {
  const type = getType(pair)

  let updatedBook
  if (isSnapshot(rec)) {
    updatedBook = rec.reduce((acc, el) => {
      const branch = bidOrAsk(el, type)
      orderbook[branch][el.PRICE] = el
      return orderbook
    }, orderbook)

    return
  }

  updatedBook = updateBookEntry(orderbook, rec)
  // console.log('>>', pair, 't' + product.replace('-', ''));

  if ('t' + product.replace('-', '') == pair) {
    cb(updatedBook)
  }
  // const prices = sortPrices(updatedBook)
  // const spread = prices.bid[0] - prices.ask[0]

  // console.log(updatedBook)
  // console.log(
  //   'Bid: ', prices.bid[0], 'Ask:', prices.ask[0], 'Spread', spread
  // )
}

function updateBookEntry (orderbook, rec) {
  const { COUNT, AMOUNT, PRICE } = rec
  // when count = 0 then you have to delete the price level.
  if (COUNT === 0) {
    // if amount = 1 then remove from bids
    if (AMOUNT === 1) {
      delete orderbook.bid[PRICE]
      return orderbook
    } else if (AMOUNT === -1) {
      // if amount = -1 then remove from asks
      delete orderbook.ask[PRICE]
      return orderbook
    }

    console.error('[ERROR] amount not found', rec)
    return orderbook
  }

  // when count > 0 then you have to add or update the price level
  if (COUNT > 0) {
    // 3.1 if amount > 0 then add/update bids
    if (AMOUNT > 0) {
      orderbook.bid[PRICE] = rec
      return orderbook
    } else if (AMOUNT < 0) {
      // 3.2 if amount < 0 then add/update asks
      orderbook.ask[PRICE] = rec
      return orderbook
    }

    console.error('[ERROR] side not found', rec)
    return orderbook
  }
}

function sortPrices (book) {
  const res = {}
  res.bid = Object.keys(book.bid).sort((a, b) => {
    return +a >= +b ? -1 : 1
  })
  res.ask = Object.keys(book.ask).sort((a, b) => {
    return +a <= +b ? -1 : 1
  })

  return res
}

const convert = (book) => {
	const result = {
		id: 1,
		bids: [],
		asks: [],
	};

	let totalBids = 0;
	for(var key in book.bid) {
		const item = book.bid[key];
		let totalSize = item.AMOUNT;
		totalBids += totalSize;
		result.bids.push({
			price: item.PRICE,
			totalSize,
			totalBids
		})
	}

	let totalAsks = 0;
	for(var key in book.ask) {
		const item = book.ask[key];
		let totalSize = Math.abs(item.AMOUNT);
		totalAsks += totalSize;
		result.asks.push({
			price: Math.abs(item.PRICE),
			totalSize,
			totalAsks
		})
	}

	return result;
}


function subscribe(cb, product = 'BTC-USD', orderCount = 10, interval = 5000) {
  // console.log('>>')
	start(_.throttle(updatedBook => {
		const data = convert(updatedBook);
		// console.log(data)
		cb(data)
	}, interval), orderCount, product)
}

// subscribe((data)=>{
// 	console.log(data)
// })

module.exports = {
    subscribe
}
// start((updatedBook) => {
//   // const prices = sortPrices(updatedBook)
//   // const spread = prices.bid[0] - prices.ask[0]

//   // console.log(updatedBook);
//   console.log(convert(updatedBook));

//   // console.log(
//   //   'Bid: ', prices.bid[0], 'Ask:', prices.ask[0], 'Spread', spread
//   // )
// })