import { EmbedBuilder, Events } from 'discord.js';
import { BotModule } from './util/module.mjs';
import { config } from './util/config.mjs';

export default class GitHubIssueParserModule extends BotModule {

	/**
	 * Creates an instance of GitHubIssueParserModule.
	 *
	 * @constructor
	 * @param {import('discord.js').Client} client
	 */
	constructor (client) {
		super(
			client,
			'Github Issue Parser',
			'Parses #discriminators and links respective issue/pull requests'
		);
	}

	init() {
		this.client.on(Events.MessageCreate, async (message) => {
			// Only process messages containing a #
			if (message.author.bot || !message.content.includes('#')) return;

			// Remove code blocks and inline code
			const noBlockCode = message.content.replace(/```[\s\S]*?```/g, '');
			const noInlineCode = noBlockCode.replace(/`[^`]*`/g, '');

			// Match patterns:
			// 1. #123
			// 2. repo#123
			// 3. org/repo#123
			const regex = /(?:(?<org>[A-Za-z0-9_.-]+)\/(?<repo>[A-Za-z0-9_.-]+)|(?<repoOnly>[A-Za-z0-9_.-]+))?#(?<issue>\d{3,5})(?!\d)/g;

			const matches = [...noInlineCode.matchAll(regex)];

			if (!matches.length) return;

			// Initiate array for output
			/** @type {string[]} */
			const output = [];
			const seen = new Set();

			for (const m of matches) {
				if (!m.groups || typeof m.groups.issue !== 'string') return;

				const org = m.groups.org || config.github.allowedOrgs[0];
				const repo = m.groups.repo || m.groups.repoOnly || config.github.defaultRepo;
				const issue = parseInt(m.groups.issue);

				if (
					!config.github.allowedOrgs
						.map((str) => str.toLowerCase())
						.includes(org.toLowerCase())
				) continue;

				const key = `${org}/${repo}#${issue}`;
				if (seen.has(key)) { continue; }
				seen.add(key);

				// Fetch data from URL
				await fetch(`https://api.github.com/repos/${org}/${repo}/issues/${issue}`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						'Accept': 'application/vnd.github.v3+json',
						'Authorization': `token ${process.env.PATOKEN}`,
					}
				}).then(async (response) => {
					// get json response and make sure status ok
					// TODO: define response shape with TS
					const data = await response.json();
					if (response.status === 200 || response.status === 304) {

						// Check for valid JSON response
						if (data.user.login) {
							// Initialize emoji variable
							/** @type {import('discord.js').GuildEmoji} */
							let status;

							// If Else stack to set status to proper emoji. should probably be a switch case in hindsight
							if (data.pull_request === undefined && data.state === 'open') {
								status = this.client.emojis.cache.find(emoji => emoji.name === 'issue_opened');
							}
							else if (data.pull_request === undefined && data.state_reason === 'completed') {
								status = this.client.emojis.cache.find(emoji => emoji.name === 'issue_closed');
							}
							else if (data.pull_request === undefined && data.state_reason === 'not_planned') {
								status = this.client.emojis.cache.find(emoji => emoji.name === 'issue_not_planned');
							}
							else if (data.pull_request.url && data.draft) {
								status = this.client.emojis.cache.find(emoji => emoji.name === 'pr_draft');
							}
							else if (data.pull_request.url && data.state === 'open') {
								status = this.client.emojis.cache.find(emoji => emoji.name === 'pr_opened');
							}
							else if (data.pull_request.url && data.pull_request.merged_at) {
								status = this.client.emojis.cache.find(emoji => emoji.name === 'pr_merged');
							}
							else if (data.pull_request.url && data.state === 'closed') {
								status = this.client.emojis.cache.find(emoji => emoji.name === 'pr_closed');
							}
							else {
								status = this.client.emojis.cache.find(emoji => emoji.name === 'spoopy');
							}

							// Push new pretty link to output array
							output.push(`[${status ?? ''} [${org}/${repo}] #${issue}, @${data.user.login}: ${data.title}](${data.html_url})`);
						}
					}
					if (response.status === 422 || response.status === 403) {
						const errorEmbed = new EmbedBuilder()
							.setColor(this.colors.RED)
							.setDescription('Slow down. The GitHub API is displeased.');
						// Send it
						return await message.channel.send({ embeds: [errorEmbed] });
					}
				})
					.catch((err) => {
						console.log(err);
					});

				if (output.length > 9) {
					console.log("break");
					break;
				}
			}

			if (output && output.length) {
				// Build output embed
				const parseEmbed = new EmbedBuilder()
					.setColor(this.colors.GREEN)
					.setDescription(output.join('\n'));
				// Send it
				return await message.channel.send({ embeds: [parseEmbed] });
			}
		});
	}
}
