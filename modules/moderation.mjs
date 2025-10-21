import { blockQuote, EmbedBuilder, Events, AuditLogEvent } from 'discord.js';
// const { green, yellow, orange, red, gray } = require('../config.json');
import config from "../config.json" with { type: 'json' };
import { BotModule } from './util/module.mjs';
import * as my_lzma from 'lzma'

export default class ModerationModule extends BotModule {
	/**
	 * Cache color configuration here + TS assertions
	 * @constant
	 */
	colors = {
		RED: /** @type {`#${string}`} */ (config.red),
		GREEN: /** @type {`#${string}`} */ (config.green),
		YELLOW: /** @type {`#${string}`} */ (config.yellow),
		ORANGE: /** @type {`#${string}`} */ (config.orange),
		GRAY: /** @type {`#${string}`} */ (config.gray)
	};

	/**
	 * The RegExp for URLs
	 *
	 * @type {RegExp}
	 */
	urlReg = RegExp(/https?:\/\/\w+/);

	constructor () {
		super(
			'Moderation',
			'The Git Shit Din:tm:',
			['messageCreate']
		);
	}

	/** @param {import('discord.js').Client} client */
	init(client) {
		/* ============================

				Moderation Commands

		=============================*/
		client.on(Events.InteractionCreate, async (interaction) => {
			if (!interaction.isChatInputCommand()) return;

			// REPORT COMMAND
			if (interaction.commandName === 'report') {
				const reportUser = interaction.options.getUser('user');
				const reportMessage = interaction.options.getString('message');
				const reportDetails = interaction.options.getString('details');

				if (!reportMessage) {
					const embed = new EmbedBuilder()
						.setColor(this.colors.RED)
						.setDescription('Message must not be empty.');
					return await interaction.reply({ embeds: [embed], ephemeral: true });
				}

				if (!this.urlReg.test(reportMessage)) {
					const embed = new EmbedBuilder()
						.setColor(this.colors.RED)
						.setDescription('Message option must be a link to message.');
					return await interaction.reply({ embeds: [embed], ephemeral: true });
				}

				const modEmbed = new EmbedBuilder()
					.setAuthor({ name: 'Report Received', iconURL: interaction.guild.iconURL({ size: 64 }) ?? '' })
					.setColor(this.colors.YELLOW)
					.setDescription(`**Reported User:** ${reportUser.tag} ${reportUser}
													**Reported Message:** [Context](${reportMessage})
													**Report Details:**
													${blockQuote(reportDetails)}`);

				const modRole = interaction.guild.roles.cache.find(role => role.name === 'Moderator');
				await interaction.guild.channels.cache.find(channel => channel.name === 'mod')
					.send({ content: `${modRole}, a report has been received from ${interaction.member} (${interaction.user.tag}).`, embeds: [modEmbed] });

				const embed = new EmbedBuilder()
					.setColor(this.colors.GREEN)
					.setDescription('Report successfully sent to moderation.');

				await interaction.reply({ embeds: [embed], ephemeral: true });
			}
		});
		/* ============================

				Moderation Logs

		=============================*/
		// log staff message deletions
		client.on(Events.MessageDelete, async (message) => {
			// Immediately return partials as they have no content to log
			if (message.partial) return console.log(`${message.id} Uncached Message Deleted`);
			if (message.author.bot || message.channel.name === 'admin' || message.channel.name === 'log') return;

			// STAFF DELETE LOG (bots do not trigger this, unfortunately)
			const fetchedLogs = await message.guild.fetchAuditLogs({
				limit: 1,
				type: AuditLogEvent.MessageDelete,
			});
			const deleteLog = fetchedLogs.entries.first();
			if (deleteLog) {
				if (Date.now() - deleteLog.createdTimestamp < 300000) {
					const { executor, target } = deleteLog;
					if (target.id === message.author.id) {
						// chop message to 250
						let small = message.cleanContent.substring(0, 250);
						if (message.cleanContent.length > 249) {
							const compress = my_lzma.compress(message.cleanContent, 1);
							const base64data = Buffer.from(compress).toString('base64');
							small = `${small}... [full message](https://nopaste.ml/#${base64data})`;
						}
						// build evidence log embed
						const embed = new EmbedBuilder()
							.setColor(this.colors.GRAY)
							.setTimestamp()
							.setFooter({ text: `Member: ${message.author.id}` })
							.setAuthor({
								name: `Message Logged (#${message.channel.name})`,
								iconURL: message.guild.iconURL({ size: 64 }) ?? '',
							})
							.setDescription(`**Offender:** ${message.author.tag} ${message.author}
															**Staff:** ${executor.tag} ${executor}

															**Message:**
															${blockQuote(small)}`);
						// send evidence log embed
						return await message.guild.channels.cache.find(channel => channel.name === 'evidence')
							.send({ embeds: [embed], files: [...message.attachments.values()] });
					}
				}
			}
		});

		// log kicks
		client.on(Events.GuildMemberRemove, async (member) => {
			const fetchedLogs = await member.guild.fetchAuditLogs({
				limit: 1,
				type: AuditLogEvent.MemberKick,
			});
			const kickLog = fetchedLogs.entries.first();
			if (!kickLog) return;

			const { executor, target, reason } = kickLog;
			if (kickLog.createdAt > member.joinedAt) {
				if (target.id === member.id) {
					const embed = new EmbedBuilder()
						.setColor(this.colors.ORANGE)
						.setTimestamp()
						.setAuthor({
							name: 'Member Kicked',
							iconURL: member.guild.iconURL({ size: 64 }) ?? '',
						})
						.setFooter({ text: `Member: ${member.user.id}` })
						.setDescription(`**Offender:** ${member.user.tag} ${member.user}
															**Staff:** ${executor.tag} ${executor}
															**Reason:** ${reason}`);

					await member.guild.channels.cache.find(channel => channel.name === 'evidence')
						.send({ embeds: [embed] });
				}
			}
		});

		// log bans
		client.on(Events.GuildBanAdd, async (ban) => {
			const fetchedLogs = await ban.guild.fetchAuditLogs({
				limit: 1,
				type: AuditLogEvent.MemberBanAdd,
			});
			const banLog = fetchedLogs.entries.first();
			if (!banLog) return;

			const { executor, target, reason } = banLog;
			if (target.id === ban.user.id) {
				const embed = new EmbedBuilder()
					.setColor(this.colors.RED)
					.setTimestamp()
					.setAuthor({
						name: 'Member Banned',
						iconURL: ban.guild.iconURL({ size: 64 }) ?? '',
					})
					.setFooter({ text: `Member: ${ban.user.id}` })
					.setDescription(`**Offender:** ${ban.user.tag} ${ban.user}
														**Staff:** ${executor.tag} ${executor}
														**Reason:** ${reason}`);

				await ban.guild.channels.cache
					.find(channel => channel.name === 'evidence')
					.send({ embeds: [embed] });
			}
		});
	}
}
