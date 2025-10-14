const { blockQuote } = require('@discordjs/builders');
const { EmbedBuilder, Events, AuditLogEvent } = require('discord.js');
const { green, yellow, orange, red, gray } = require('../config.json');
const urlReg = /https?:\/\/\w+/;
const my_lzma = require('lzma');

module.exports = {

	name: 'Moderation',
	description: 'The Git Shit Din:tm:',
	listeners: ['messageCreate'],

	async execute(client) {
		/* ============================

				Moderation Commands

		=============================*/
		client.on(Events.InteractionCreate, async interaction => {
			if (!interaction.isChatInputCommand()) return;

			// REPORT COMMAND
			if (interaction.commandName === 'report') {
				const reportUser = interaction.options.getUser('user');
				const reportMessage = interaction.options.getString('message');
				const reportDetails = interaction.options.getString('details');

				if (!urlReg.test(reportMessage)) {
					const embed = new EmbedBuilder()
						.setColor(red)
						.setDescription('Message option must be a link to message.');
					return await interaction.reply({ embeds: [embed], ephemeral: true });
				}

				const modEmbed = new EmbedBuilder()
					.setAuthor('Report Received', interaction.guild.iconURL({ size: 64, dynamic: true }))
					.setColor(yellow)
					.setDescription(`**Reported User:** ${reportUser.tag} ${reportUser}
													**Reported Message:** [Context](${reportMessage})
													**Report Details:**
													${blockQuote(reportDetails)}`);

				const modRole = await interaction.guild.roles.cache.find(role => role.name === 'Moderator');
				await interaction.guild.channels.cache.find(channel => channel.name === 'mod')
					.send({ content: `${modRole}, a report has been received from ${interaction.member} (${interaction.user.tag}).`, embeds: [modEmbed] });

				const embed = new EmbedBuilder()
					.setColor(green)
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
							.setColor(gray)
							.setTimestamp()
							.setFooter({ text: `Member: ${message.author.id}` })
							.setAuthor({
								name: `Message Logged (#${message.channel.name})`,
								iconURL: message.guild.iconURL({ size: 64, dynamic: true }),
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
						.setColor(orange)
						.setTimestamp()
						.setAuthor({
							name: 'Member Kicked',
							iconURL: member.guild.iconURL({ size: 64, dynamic: true }),
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
					.setColor(red)
					.setTimestamp()
					.setAuthor({
						name: 'Member Banned',
						iconURL: ban.guild.iconURL({ size: 64, dynamic: true }),
					})
					.setFooter({ text: `Member: ${ban.user.id}` })
					.setDescription(`**Offender:** ${ban.user.tag} ${ban.user}
														**Staff:** ${executor.tag} ${executor}
														**Reason:** ${reason}`);

				await ban.guild.channels.cache.find(channel => channel.name === 'evidence')
					.send({ embeds: [embed] });
			}
		});
	},
};
