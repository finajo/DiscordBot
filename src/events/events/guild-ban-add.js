'use strict';

const EventLog = require('../base');
const EventEmbed = require('../event-embed');

module.exports = class GuildBanAddEvent extends EventLog {
	constructor(client) {
		super(client, { name: 'guildBanAdd' });
	}

	/**
	 * @param {Guild} guild - Guild that user was banned from
	 * @param {User} user - User that was banned
	 */
	_run(guild, user) {
		const embed = {
			description: `${user} was banned ⛔️`,
			author: {
				name: `${user.username}#${user.discriminator}`,
				icon_url: user.avatarURL // eslint-disable-line camelcase
			}
		};

		EventEmbed.sendUserEmbed(this._getLogChannel(guild), user.id, embed);
	}
};
