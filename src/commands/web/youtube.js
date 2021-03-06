'use strict';

const cleanReply = require('../../modules/clean-reply');
const config = require('../../assets/config.json');
const WebCommand = require('../../bases/web');
const winston = require('winston');
const Youtube = require('youtube-node');

module.exports = class YoutubeCommand extends WebCommand {
	constructor(client) {
		super(client, {
			name: 'youtube',
			aliases: ['yt'],
			memberName: 'youtube',
			description: 'Search for videos on Youtube.'
		});
	}

	/**
	 * @Override
	 */
	async _query(msg, args) {
		const query = args.query;
		const youtube = new Youtube();
		youtube.setKey(config.tokens.google);

		return youtube.search(query, 1, (err, res) => {
			if(err) {
				winston.error(err);
				throw new Error('Something went wrong when searching for the video.');
			}

			if(res.items.length === 0) {
				return cleanReply(msg, 'No results for that search.');
			}

			return cleanReply(msg, this._getUrl(res.items[0]));
		});
	}

	_getUrl(result) {
		switch(result.id.kind) {
		case 'youtube#playlist':
			return `http://www.youtube.com/playlist?list=${result.id.playlistId}`;
		case 'youtube#video':
			return `http://www.youtube.com/watch?v=${result.id.videoId}`;
		case 'youtube#channel':
			return `http://www.youtube.com/channel/${result.id.channelId}`;
		default:
			return 'No results for that search.';
		}
	}
};
