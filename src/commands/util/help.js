'use strict';

const { Command } = require('discord.js-commando');
const { stripIndents, oneLine } = require('common-tags');
const cleanReply = require('../../modules/clean-reply');
const config = require('../../assets/config.json');
const Discord = require('discord.js');
const sendError = require('../../modules/send-error');
const winston = require('winston');

/**
 * The default help command does not support outputting to server. It has no methods outside the
 * constructor and run(), so overriding only the relevant methods is not an option. As such, this
 * is almost a complete copy of the logic behind the default help command.
 * @see Schuyler Cebulskie (Gawdl3y) {@link https://github.com/Gawdl3y}
 * @see {@link https://github.com/Gawdl3y/discord.js-commando/blob/master/src/commands/util/help.js}
 */
module.exports = class HelpCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'help',
			group: 'util',
			memberName: 'help',
			aliases: ['commands'],
			description: 'Displays a list of available commands, or detailed information for a specified command.',
			details: oneLine`
				The command may be part of a command name or a whole command name.
				If it isn't specified, all available commands will be listed.
			`,
			examples: ['help', 'help prefix'],
			guarded: true,
			args: [
				{
					key: 'command',
					prompt: 'Which command would you like to view the help for?',
					type: 'string',
					default: ''
				}
			]
		});

		this._embedColor = '#51c151';
	}
	
	async run(msg, args) {
		const commands = this.client.registry.findCommands(args.command, false, msg);
		const showCommandsHere = (args.command && args.command.toLowerCase() === 'here');
		const showAllCommands = (args.command && args.command.toLowerCase() === 'all');
		
		try {
			if(!args.command || showAllCommands) return await this._showCommandsInDM(msg, showAllCommands);
			if(showCommandsHere) return await this._showAllCommandsInChannel(msg);
			if(commands.length === 1) return await this._showSingleCommand(msg, commands[0]);
			if(commands.length > 1) return cleanReply(msg, this._disambiguation(commands, 'commands'));

			return await cleanReply(
				msg,
				`Unable to identify command. Use ${msg.usage(null, null, null)} to view the list of all commands.`
			);
		} catch(err) {
			winston.error(err);
			return sendError(msg, err);
		}
	}

	async _showSingleCommand(msg, command) {
		const bullet = config.embed_bullet;
		const prefix = config.embed_prefix;
		const help = new Discord.RichEmbed({
			title: `__${command.name}__`,
			description: `${command.description}`,
			fields: [
				{
					name: `${prefix} Server Only`,
					value: command.guildOnly ? 'Yes' : 'No',
					inline: true
				},
				{
					name: `${prefix} Group`,
					value: `${command.group.name} (\`${command.groupID}:${command.memberName}\`)`,
					inline: true
				},
				{
					name: `${prefix} Format`,
					value: msg.anyUsage(`${command.name}${command.format ? ` ${command.format}` : ''}`)
				}
			]
		});
		if(command.details) help.addField(`${prefix} Details`, command.details);
		if(command.examples && command.examples.length > 0) {
			help.addField(
				`${prefix} Examples`,
				`${bullet} ${command.examples.join(`\n${bullet} `)}`
			);
		}
		help.setColor(this._embedColor);

		return cleanReply(msg, { embed: help });
	}

	async _showAllCommandsInChannel(msg) {
		const help = this._constructCommandsHelp(msg, false, true, ', ', cmd => `${cmd.name}`);
		return msg.embed(help);
	}

	async _showCommandsInDM(msg, showAllCommands) {
		const help = this._constructCommandsHelp(
			msg,
			true,
			showAllCommands,
			'\n',
			cmd => `${config.embed_bullet} **${cmd.name}**: ${cmd.description}`
		);

		const messages = [];
		try {
			if(msg.channel.type !== 'dm') messages.push(await cleanReply(msg, 'Sent you a DM with information.'));
			messages.push(await msg.author.sendEmbed(help));
		} catch(err) {
			messages.push(await cleanReply(msg, 'Unable to send you the help DM. You probably have DMs disabled.'));
		}
		return messages;
	}

	/**
	 * How the commands within a command group are formatted for displaying in help.
	 * @callback cmdFormatCallback
	 * @param {Command} cmd - Command to be formatted
	 * @returns {string}
	 */

	/**
	 * Format command groups and their respective commands into a list.
	 * @param {CommandMessage} msg
	 * @param {boolean} sendingToDM - Whether the help is going to a DM
	 * @param {boolean} showAllCommands
	 * @param {string} delimiter - How to separate commands when made into a string
	 * @param {cmdFormat} callback
	 * @returns {string}
	 */
	_constructCommandsHelp(msg, sendingToDM, showAllCommands, delimiter, callback) {
		const title = showAllCommands
			? 'All Commands'
			: `Available Commands In ${msg.guild || 'This DM'}`;
		const usagePrefix = msg.guild ? msg.guild.commandPrefix : null;
		const moreInfo = sendingToDM
			? stripIndents`
				To run a command in this DM, simply use ${Command.usage('command', null, null)} with no prefix.
				Use ${this.usage('all', null, null)} to view a list of *all* commands, not just available ones.`
			: `Use ${this.usage('', null, null)} to view a list of commands with their descriptions.`;
		const description = stripIndents`
			${oneLine`
				To run a command in ${msg.guild || 'any server'},
				use ${Command.usage('command', usagePrefix, this.client.user)}.
				For example, ${Command.usage('prefix', usagePrefix, this.client.user)}.`}
			${moreInfo}
			Use ${this.usage('<command>', null, null)} to view detailed information about a specific command.`;
		const help = new Discord.RichEmbed({
			title: `__${title}__`,
			description: description,
			fields: this._getCmdGroupsFields(msg, showAllCommands, delimiter, callback)
		});
		help.setColor(this._embedColor);

		return help;
	}

	/**
	 * Format command groups and their respective commands into a list.
	 * @param {CommandMessage} msg
	 * @param {boolean} showAllCommands
	 * @param {string} delimiter
	 * @param {cmdFormatCallback} callback
	 * @returns {string}
	 */
	_getCmdGroupsFields(msg, showAllCommands, delimiter, callback) {
		let groups = this.client.registry.groups;
		if(showAllCommands) groups = groups.filter(grp => grp.commands.some(cmd => cmd.isUsable(msg)));

		const fieldInfoForGroups = groups.map(group => {
			const commands = showAllCommands
					? group.commands
					: group.commands.filter(cmd => cmd.isUsable(msg));
			return this._getFieldInfoForGroup(group, commands.map(callback), delimiter);
		});
		
		return this._constructEmbedFields(fieldInfoForGroups);
	}

	/**
	 * @typedef {Object} FieldInfo
	 * @property {string} name - Field name
	 * @property {Array<string>} values - List of commands, separated into multiple fields if
	 * 										max length of one is over 1024
	 */

	/**
	 * Fields can only have a max length of 1024. If a field goes over the limit, construct a new field to continue
	 * the commands. Once all groups have been mapped, call _constructEmbedFields() to properly construct the fields.
	 * @param {CommandGroup} group
	 * @param {Array<string>} commands
	 * @param {string} delimiter
	 * @returns {FieldInfo}
	 */
	_getFieldInfoForGroup(group, commands, delimiter) {
		const maxLen = 1024;
		const fieldValues = [''];
		let fieldInd = 0;

		for(let i = 0; i < commands.length; i++) {
			const cmd = `${commands[i]}${i === (commands.length - 1) ? '' : delimiter}`;
			if(fieldValues[fieldInd].length + cmd.length > maxLen) {
				fieldInd++;
				fieldValues[fieldInd] = '';
			}

			fieldValues[fieldInd] += cmd;
		}

		return {
			name: `${config.embed_prefix} ${group.name}`,
			values: fieldValues
		};
	}

	/**
	 * @see _getFieldInfoForGroup()
	 * @param {Array<FieldInfo>} fieldsInfo
	 * @returns {Array<{name: string, value: string}>} Array of Embed fields
	 */
	_constructEmbedFields(fieldsInfo) {
		const fields = [];
		fieldsInfo.forEach(groupInfo => {
			for(let i = 0; i < groupInfo.values.length; i++) {
				fields.push({
					name: (i === 0) ? groupInfo.name : config.zero_width_space,
					value: groupInfo.values[i]
				});
			}
		});
		return fields;
	}

	// eslint-disable-next-line valid-jsdoc
	/**
	 * @author Schuyler Cebulskie (Gawdl3y) {@link https://github.com/Gawdl3y}
	 * @see {@link https://github.com/Gawdl3y/discord.js-commando/blob/master/src/util.js}
	 */
	_disambiguation(items, label, property = 'name') {
		const itemList = items.map(item => `"${(property ? item[property] : item)
			.replace(/ /g, '\xa0')}"`).join(',   ');
		return `Multiple ${label} found, please be more specific: ${itemList}`;
	}
};
