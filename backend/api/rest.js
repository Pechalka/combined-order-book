
var tokens = [
	{
		symbol: 'BTC'
	},
	{
		symbol: 'ETH'
	},
	{
		symbol: 'LTC'
	}
];

function getTokens(req, res) {
	res.send(tokens)
}

module.exports = {
    getTokens: getTokens
}