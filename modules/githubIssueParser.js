require('dotenv').config();
const { EmbedBuilder, Events } = require('discord.js');
const { green, red } = require('../config.json');
const fetch = require('node-fetch');

module.exports = {

	name: 'Github Issue Parser',
	description: 'Parses #discriminators and links respective issue/pull requests',
	listeners: ['messageCreate'],

	async execute(client) {

		/* ============================

				Message Create

		=============================*/
		client.on(Events.MessageCreate, async message => {
			if (message.author.bot) return;

			// Only look at messages containing a pound sign
			if (message.content.includes('#')) {
				// Remove code blocks and their contents
				const noBlockCode = message.content.replace(/(```(.+?)```)/gms, '');
				// Remove inline code snippets and their contents
				const noCode = noBlockCode.replace(/(`(.+?)`)/gms, '');
				// Check remaining text for valid tags
				const match = noCode.match(/#\d{3,5}/g);
				// Make sure there are tags
				if (match && match.length) {
					// Kind of jank, convert to set to remove duplicates
					const unique = [...new Set(match)];
					// Convert right back to array for array operations
					const tags = Array.from(unique);
					// Initiate array for output
					const output = [];
					// Loop tags
					for (const tag of tags) {
						// Build fetch parameters
						const url = `https://api.github.com/repos/LMMS/lmms/issues/${tag.substring(1)}`;
						const options = {
							method: 'GET',
							headers: {
								'Content-Type': 'application/json',
								'Accept': 'application/vnd.github.v3+json',
								'Authorization': `token ${process.env.PATOKEN}`,
							},
						};
						// Fetch data from URL
						await fetch(url, options)
							.then(async (response) => {
								// get json response and make sure status ok
								const data = await response.json();
								if (response.status === 200 || response.status === 304) {

									// Check for valid JSON response
									if (data.user.login) {
										// Initialize emoji variable
										let status;

										// If Else stack to set status to proper emoji. should probably be a switch case in hindsight
										if (data.pull_request === undefined && data.state === 'open') {
											status = client.emojis.cache.find(emoji => emoji.name === 'issue_opened');
										}
										else if (data.pull_request === undefined && data.state_reason === 'completed') {
											status = client.emojis.cache.find(emoji => emoji.name === 'issue_closed');
										}
										else if (data.pull_request === undefined && data.state_reason === 'not_planned') {
											status = client.emojis.cache.find(emoji => emoji.name === 'issue_not_planned');
										}
										else if (data.pull_request.url && data.draft) {
											status = client.emojis.cache.find(emoji => emoji.name === 'pr_draft');
										}
										else if (data.pull_request.url && data.state === 'open') {
											status = client.emojis.cache.find(emoji => emoji.name === 'pr_opened');
										}
										else if (data.pull_request.url && data.pull_request.merged_at) {
											status = client.emojis.cache.find(emoji => emoji.name === 'pr_merged');
										}
										else if (data.pull_request.url && data.state === 'closed') {
											status = client.emojis.cache.find(emoji => emoji.name === 'pr_closed');
										}
										else {
											status = client.emojis.cache.find(emoji => emoji.name === 'spoopy');
										}
										// Push new pretty link to output array
										output.push(`[${status.toString()} ${tag}, @${data.user.login}: ${data.title}](https://github.com/LMMS/lmms/issues/${tag.substring(1)})`);
									}
								}
								if (response.status === 422 || response.status === 403) {
									const errorEmbed = new EmbedBuilder()
										.setColor(red)
										.setDescription('Slow down. The GitHub API is displeased.');
									// Send it
									return await message.channel.send({ embeds: [errorEmbed] });
								}
							})
							.catch((err) => {
								console.log(err);
							});

						if (output.length > 9) {
							break;
						}
					}
					if (output.length) {
						// Build output embed
						const parseEmbed = new EmbedBuilder()
							.setColor(green)
							.setDescription(output.join('\n'));
						// Send it
						return await message.channel.send({ embeds: [parseEmbed] });
					}
				}
			}

		});
	},
};
