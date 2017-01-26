/* eslint-disable valid-jsdoc */

'use strict';

const Discord = require('discord.js');

module.exports = class EventEmbed {
	/**
	 * Embed for user-related events
	 * @see sendEmbed()
	 */
	static sendUserEmbed(channel, id, embedInfo) {
		EventEmbed.sendEmbed('#eacb00', channel, id, embedInfo);
	}

	/**
	 * Embed for message-related events
	 * @see sendEmbed()
	 */
	static sendMessageEmbed(channel, id, embedInfo) {
		this.sendEmbed('#cb0f0f', channel, id, embedInfo);
	}

	/**
	 * Embed for text channel-related events
	 * @see sendEmbed()
	 */
	static sendChannelEmbed(channel, id, embedInfo) {
		EventEmbed.sendEmbed('#67a4e2', channel, id, embedInfo);
	}

	/**
	 * Embed for voice channel-related events
	 * @see sendEmbed()
	 */
	static sendVoiceEmbed(channel, id, embedInfo) {
		EventEmbed.sendEmbed('#8e72e2', channel, id, embedInfo);
	}

	/**
	 * @param {string|number|number[]} color - Color of embed
	 * @param {GuildChannel} channel - Channel to send embed to
	 * @param {String} id - ID to add to footer
	 * @param {RichEmbed} embedInfo - Information to include in the embed
	 */
	static sendEmbed(color, channel, id, embedInfo) {
		const embed = new Discord.RichEmbed(embedInfo);
		embed.setDescription(`**${embedInfo.description}**`);
		embed.setColor(color);
		embed.setFooter(`ID: ${id}`);
		embed.setTimestamp(new Date());

		channel.sendEmbed(embed);
	}
};
