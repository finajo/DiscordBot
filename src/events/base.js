'use strict';

const winston = require('winston');

module.exports = class EventLog {
	/**
	 * @typedef {Object} RichEmbed
	 * @see {@link https://discord.js.org/#/docs/main/stable/class/RichEmbed}
	 */

	/**
	 * @typedef {Object} GuildChannel
	 * @see {@link https://discord.js.org/#/docs/main/stable/class/GuildChannel}
	 */

	/**
	 * @typedef {Object} EventInfo
	 * @property {String} name - WSEventType name in camelCase.
	 * @see {@link https://discord.js.org/#/docs/main/stable/typedef/WSEventType}
	 */

	/**
	 * @param {CommandoClient} client - The client the event is for
	 * @param {EventInfo} info - The event information
	 */
	constructor(client, info) {
		Object.defineProperty(this, 'client', { value: client });
		Object.defineProperty(this, 'name', { value: info.name });
	}

	register() {
		this.client.on(this.name, (...args) => {
			try {
				const guild = args[0].guild || args[1].guild;
				const modLogSettings = this.client.provider.get(guild, 'mod_log', {});

				if(!modLogSettings.enabled) return;

				this._run(...args);
			} catch(err) {
				winston.error(`No Guild Found: \n ${err.stack}`);
				winston.debug(args);
			}
		});
	}

	_getLogChannel(guild) {
		const modLogSettings = this.client.provider.get(guild, 'mod_log', {});
		return guild.channels.get(modLogSettings.channelID);
	}

	_isLogChannel(msg) {
		return (this._getLogChannel(msg.guild) === msg.channel);
	}

	/**
	 * Function to run when the event is triggered.
	 * @abstract
	 */
	_run(...args) { // eslint-disable-line no-unused-vars
		throw new Error(`${this.constructor.name} doesn't have a run() method.`);
	}
};
