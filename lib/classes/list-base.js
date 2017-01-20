'use strict';

const Commando = require('discord.js-commando');
const winston = require('winston');
const oneLine = require('common-tags').oneLine;
const fs = require('fs');
const sqlite = require('sqlite');
const alerts = require('../modules/alerts');

module.exports = class ListBaseCommand extends Commando.Command {
	/**
	 * @typedef {Object} Reply
	 * @property {boolean} error - Whether or not an error occurred
	 * @property (string} msg - The message to reply with
	 */

	/**
	 * @param {CommandClient} client
	 * @param {string} listName - Name of list
	 * @param {CommandInfo} commandInfo
	 * @param {boolean} [isArrList = false] - Whether the list is an object or an array
	 */
	constructor(client, listName, commandInfo, isArrList = false) {
		super(client, commandInfo);
		this.listName = listName;
		this.isArrList = isArrList;
	}

	async run(msg, args) {
		let list = this.getList();
		let res = this.getReply(args, list);

		if(res.error) {
			return alerts.sendError(msg, res.msg);
		}

		this.client.provider.set('global', this.listName, list)
			.catch(winston.error);

		msg.delete(2000);
		return msg.reply(res.msg);
	}

	getList() {
		const path = `lib/assets/${this.listName}.json`;
		let defaultList;

		try {
			fs.accessSync(path, fs.constants.F_OK);
			defaultList = fs.readFileSync(path);
		} catch(err) {
			defaultList = (this.isArrList) ? {} : [];
		}

		return this.client.provider.get(
			'global',
			this.listName,
			defaultList
		);
	}

	isUrl(item) {
		return (item.search(/https?:\/\/[^ \/\.]+\.[^ \/\.]+/) !== -1);
	}

	/**
	 * The reply will change based on whatever the command does and thus must be overridden.
	 * @returns {Reply}
	 */
	getReply(args, list) {
		return {
			error: true,
			msg: oneLine`ListBase:getReply() was not overridden. 
                This error should never happen. Please contact @Kyuu#9384`
		};
	}
}