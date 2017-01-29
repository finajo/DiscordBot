'use strict';

const EventLog = require('../base');
const EventEmbed = require('../event-embed');
const { oneLine } = require('common-tags');

module.exports = class VoiceStateUpdateEvent extends EventLog {
	constructor(client) {
		super(client, { name: 'voiceStateUpdate' });
	}

	/**
	 * @param {GuildMember} before - User before the change
	 * @param {GuildMember} after - User after the change
	 */
	run(before, after) {
		const embed = {
			author: {
				name: `${before.user.username}#${before.user.discriminator}`,
				icon_url: before.user.avatarURL // eslint-disable-line camelcase
			}
		};
		const descriptors = this._getChangedDescriptors(before, after);
		if(!descriptors) return;
		Object.assign(embed, descriptors);

		EventEmbed.sendVoiceEmbed(this._getLogChannel(before.guild), before.user.id, embed);
	}

	_getChangedDescriptors(before, after) {
		if(before.voiceChannelID === after.voiceChannelID) return false;

		if(!before.voiceChannelID) {
			return { description: `${after.user} entered voice channel ${this._getVoiceChannel(after)}` };
		}

		if(!after.voiceChannelID) {
			return { description: `${before.user} left voice channel ${this._getVoiceChannel(before)}` };
		}

		return {
			description: oneLine`${before.user} moved from ${this._getVoiceChannel(before)}
				to ${this._getVoiceChannel(after)}`
		};
	}

	/**
	 * @param {GuildMember} member
	 * @returns {GuildChannel}
	 */
	_getVoiceChannel(member) {
		return member.guild.channels.get(member.voiceChannelID);
	}
};
