import React, { Component } from 'react';
import { Link } from 'react-router';

class List extends Component {
	constructor(props) {
		super(props);
		this.state = {
			tokens: []
		}
	}
	componentDidMount() {
		fetch('http://localhost:4000/api/tokens')
			.then(response => response.json())
			.then(tokens => this.setState({ tokens }))
	}
	render() {
		const rows = this.state.tokens.map(token => (
			<tr key={token.symbol}>
				<td>
					<Link to={`/${token.symbol}-USD`}>{token.symbol}</Link>
				</td>
			</tr>
		))
		return (
			<div>
				<table>
					<tbody>
						{rows}
					</tbody>
				</table>
			</div>
		);
	}
}

export default List;