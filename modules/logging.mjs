import { blockQuote, time, EmbedBuilder, Events, ActivityType, AuditLogEvent } from 'discord.js';
import config from '../config.json' with { type: 'json' };
import * as my_lzma from 'lzma';
import { BotModule } from './util/module.mjs';

export default class LoggingModule extends BotModule {
	/**
	 * Cache color configuration here + TS assertions
	 * @constant
	 */
	colors = {
		RED: /** @type {`#${string}`} */ (config.red),
		GREEN: /** @type {`#${string}`} */ (config.green),
		GRAY: /** @type {`#${string}`} */ (config.gray)
	};
	constructor () {
		super(
			'Logging',
			'The Big Brother module.',
			['messageUpdate', 'messageDelete', 'guildMemberAdd', 'guildMemberRemove', 'guildMemberUpdate', 'roleCreate', 'roleDelete']
		);
	}

	/** @param {import('discord.js').Client} client */
	init(client) {
		/* =========================

			Message Update Logging

		===========================*/
		client.on(Events.MessageUpdate, async (past, current) => {
			if (current.partial) await current.fetch();

			if (current.author.bot) return;
			if (current.channel.name === 'admin' || current.channel.name === 'log') return;

			const embed = new EmbedBuilder()
				.setColor(this.colors.GRAY)
				.setTimestamp()
				.setAuthor({
					name: `Message Edited (#${current.channel.name})`,
					iconURL: current.guild.iconURL({ size: 64 }) ?? '',
				})
				.setFooter({ text: `Member: ${current.member.id}` });

			// Chop current message to 250 characters
			let newSmall = current.cleanContent.substring(0, 250);
			if (current.cleanContent.length > 249) {
				newSmall = `${newSmall}...`;
			}
			// Check if old message is cached
			if (past.content != null) {
				// Botception check
				if (past.author.id === current.client.user.id) return;
				// No logging zero change edits
				if (past.content === current.content) return;

				// Chop old message to 250 characters
				let oldSmall = past.cleanContent.substring(0, 250);
				if (past.cleanContent.length > 249) {
					const compress = my_lzma.compress(past.cleanContent, 1);
					const base64data = Buffer.from(compress).toString('base64');
					oldSmall = `${oldSmall}... [full message](https://nopaste.ml/#${base64data})`;
				}

				embed.setDescription(`${current.author} ${current.author.tag}`
					+ blockQuote(`${oldSmall}\n\n${newSmall}`));
			}
			// Old message is unchached
			else {
				embed.setDescription(`${current.author} ${current.author.tag}`
					+ blockQuote(`${newSmall} (uncached)`));
			}

			await current.guild.channels.cache.find(channel => channel.name === 'logs')
				.send({ embeds: [embed] });
		});


		/* =========================

			Message Delete Logging

		===========================*/
		client.on(Events.MessageDelete, async (message) => {
			// Immediately return partials as they have no content to log
			if (message.partial) return console.log(`${message.id} Uncached Message Deleted`);

			if (message.author.bot) return;
			if (message.channel.name === 'admin' || message.channel.name === 'log') return;

			// chop message to 250
			let small = message.cleanContent.substring(0, 250);
			if (message.cleanContent.length > 249) {
				const compress = my_lzma.compress(message.cleanContent, 1);
				const base64data = Buffer.from(compress).toString('base64');
				small = `${small}... [full message](https://nopaste.ml/#${base64data})`;
			}

			const embed = new EmbedBuilder()
				.setColor(this.colors.GRAY)
				.setTimestamp()
				.setAuthor({
					name: `Message Deleted (#${message.channel.name})`,
					iconURL: message.guild.iconURL({ size: 64 }) ?? '',
				})
				.setFooter({ text: `Member: ${message.author.id}` })
				.setDescription(`${message.author} ${message.author.tag}
												${blockQuote(small)}`);

			await message.guild.channels.cache.find(channel => channel.name === 'logs')
				.send({ embeds: [embed], files: [...message.attachments.values()] });
		});


		/* =========================

			User Join Logging

		===========================*/
		client.on(Events.GuildMemberAdd, async (member) => {
			member.client.user.setActivity(`${member.guild.memberCount} LeMMingS`, { type: ActivityType.Watching });

			const embed = new EmbedBuilder()
				.setColor(this.colors.GREEN)
				.setTimestamp()
				.setAuthor({
					name: 'Member Join',
					iconURL: member.guild.iconURL({ size: 64 }) ?? '',
				})
				.setFooter({ text: `Member: ${member.user.id}` })
				.setDescription(`${member.user} ${member.user.tag}`)
				.addFields({
					name: 'Account Created',
					value: time(member.user.createdAt),
				})
				.setThumbnail(member.user.displayAvatarURL());

			await member.guild.channels.cache.find(channel => channel.name === 'logs')
				.send({ embeds: [embed] });
		});


		/* =========================

			User Leave Logging

		===========================*/
		client.on(Events.GuildMemberRemove, async (member) => {
			member.client.user.setActivity(`${member.guild.memberCount} LeMMingS`, { type: ActivityType.Watching });

			const embed = new EmbedBuilder()
				.setColor(this.colors.RED)
				.setTimestamp()
				.setAuthor({
					name: 'Member Leave',
					iconURL: member.guild.iconURL({ size: 64 }) ?? '',
				})
				.setFooter({ text: `Member: ${member.user.id}` })
				.setDescription(`${member.user} ${member.user.tag}`)
				.setThumbnail(member.user.displayAvatarURL());

			await member.guild.channels.cache.find(channel => channel.name === 'logs')
				.send({ embeds: [embed] });
		});


		/* =========================

			User Update Logging

		===========================*/
		client.on(Events.GuildMemberUpdate, async (past, current) => {
			const embed = new EmbedBuilder()
				.setColor('#999999')
				.setTimestamp()
				.setAuthor({
					name: 'Member Updated',
					iconURL: current.guild.iconURL({ size: 64 }) ?? '',
				})
				.setFooter({ text: `Member: ${current.id}` })
				.setDescription(`${current.user} ${current.user.tag}`)
				.setThumbnail(current.user.displayAvatarURL());

			const removedRoles = past.roles.cache.filter(role => !current.roles.cache.has(role.id) && !role.name.startsWith('🎨'));
			const addedRoles = current.roles.cache.filter(role => !past.roles.cache.has(role.id) && !role.name.startsWith('🎨'));
			if (removedRoles.size > 0) {
				embed.addFields({
					name: 'Roles Removed:',
					value: `${removedRoles.map(r => r.name)}`,
				});
			}
			else if (addedRoles.size > 0) {
				embed.addFields({
					name: 'Roles Added:',
					value: `${addedRoles.map(r => r.name)}`,
				});
			}
			else if (past.displayName != current.displayName) {
				embed.addFields({
					name: 'Nickname Changed:',
					value: `${past.displayName} -> ${current.displayName}`,
				});
			}
			else if (past.username != current.username) {
				embed.addFields({
					name: 'Username Changed:',
					value: `${past.username} -> ${current.username}`,
				});
			} else {
				return;
			}
			await current.guild.channels.cache.find(channel => channel.name === 'logs')
				.send({ embeds: [embed] });
		});


		/* =========================

			Role Create Logging

		===========================*/
		client.on(Events.GuildRoleCreate, async (role) => {
			const embed = new EmbedBuilder()
				.setColor(this.colors.GREEN)
				.setTimestamp()
				.setAuthor({
					name: 'Role Created',
					iconURL: role.guild.iconURL({ size: 64 }) ?? '',
				})
				.setFooter({ text: 'Member: ???' })
				.setDescription(`${role} created by ???`);

			const fetchedLogs = await role.guild.fetchAuditLogs({
				limit: 1,
				type: AuditLogEvent.RoleCreate,
			});

			if (fetchedLogs) {
				const { executor } = fetchedLogs.entries.first();
				embed.setFooter({ text: `Member: ${executor.id}` });
				embed.setDescription(`${role} created by ${executor}`);
			}

			await role.guild.channels.cache.find(channel => channel.name === 'logs')
				.send({ embeds: [embed] });
		});


		/* =========================

			Role Delete Logging

		===========================*/
		client.on(Events.GuildRoleDelete, async (role) => {

			const embed = new EmbedBuilder()
				.setColor(this.colors.RED)
				.setTimestamp()
				.setAuthor({
					name: 'Role Deleted',
					iconURL: role.guild.iconURL({ size: 64 }) ?? '',
				})
				.setFooter({ text: 'Member: ???' })
				.setDescription(`${role} deleted by ???`);

			const fetchedLogs = await role.guild.fetchAuditLogs({
				limit: 1,
				type: AuditLogEvent.RoleDelete,
			});

			if (fetchedLogs) {
				const { executor } = fetchedLogs.entries.first();
				embed.setFooter({ text: `Member: ${executor.id}` });
				embed.setDescription(`\`${role.name}\` deleted by ${executor}`);
			}

			await role.guild.channels.cache.find(channel => channel.name === 'logs')
				.send({ embeds: [embed] });
		});
	}
}
