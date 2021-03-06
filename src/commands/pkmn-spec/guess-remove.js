'use strict';

const sendError = require('../../modules/send-error');
const stripIndents = require('common-tags').stripIndents;
const ListRemoveCommand = require('../../bases/list/list-remove');

module.exports = class GuessRemoveCommand extends ListRemoveCommand {
	constructor(client) {
		super(
			client,
			'guess',
			'pkmn-spec',
			{
				requireOptions: false,
				urlOnly: false
			},
			{ examples: [`remove-guess "i'll die"`] }
		);
	}

	async run(msg, args) {
		if(args.item === `i'll`) {
			return sendError(msg, stripIndents`
				You're trying to remove the tag \`i'll\`. Please wrap your tag in quotations, like so:
				\`remove-guess "i'll die" http://i.imgur.com/V8hvLx7.png\`
			`);
		}

		if(args.item.substr(0, 4) === 'ill ') {
			args.item = `i'll ${args.item.substr(4)}`;
		}

		return super.run(msg, args);
	}
};
