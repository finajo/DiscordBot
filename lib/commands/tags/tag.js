'use strict';

const ListCommand = require('../../classes/list.js');

module.exports = class TagCommand extends ListCommand {
	constructor(client) {
		super(
			client,
			'tag',
			'tags',
			{
				requireItem: true
			}
		);
	}
}