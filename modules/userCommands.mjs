import { time, hideLinkEmbed, EmbedBuilder, Events, MessageFlags } from 'discord.js';
import config from '../config.json' with { type: 'json' };
import fs from 'node:fs';
import { BotModule } from './util/module.mjs';

export default class UserCommandsModule extends BotModule {
	/**
	 * Cache color configuration here + TS assertions
	 * @constant
	 */
	colors = {
		RED: /** @type {`#${string}`} */ (config.red),
		GREEN: /** @type {`#${string}`} */ (config.green)
	};
	constructor () {
		super('User Commands', 'permissionless commands for users', ['interactionCreate']);

	}
	/** @param {import('discord.js').Client} client */
	init(client) {
		client.on(Events.InteractionCreate, async interaction => {
			if (!interaction.isChatInputCommand()) return;

			// Whois
			if (interaction.commandName === 'whois') {
				// Get target user
				const targetUser = interaction.guild.members.cache.get(interaction.options.getUser('user').id);

				// Make sure target is from server
				if (!targetUser) {
					const embed = new EmbedBuilder()
						.setColor(this.colors.RED)
						.setDescription('Specified user was not found on this server.');
					return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
				}

				// Build embed
				const embed = new EmbedBuilder()
					.setAuthor({
						name: targetUser.user.tag,
						iconURL: targetUser.user.displayAvatarURL(),
					})
					.setImage(targetUser.displayAvatarURL({ size: 2048 }))
					.setColor(targetUser.displayHexColor)
					.addFields(
						{ name: 'Most Recent Join', value: time(targetUser.joinedAt), inline: true },
						{ name: 'Account Registered', value: time(targetUser.user.createdAt), inline: true },
					);

				// Find, sort and display roles of target
				if (targetUser.roles.cache.size > 1) {
					embed.addFields(
						{ name: 'Server Roles', value: targetUser.roles.cache.sort((a, b) => parseFloat(b.position) - parseFloat(a.position)).map(r => `${r}`).filter(f => f != '@everyone').join(', ') },
					);
				}
				await interaction.reply({ embeds: [embed], ephemeral: true });
			}

			// Server info
			if (interaction.commandName === 'server') {
				const bans = await interaction.guild.bans.fetch();
				const embed = new EmbedBuilder()
					.setAuthor({
						name: interaction.guild.name,
						iconURL: interaction.guild.iconURL(),
					})
					// .setColor(interaction.guild.me.displayHexColor)
					.setThumbnail(interaction.guild.iconURL({ size: 128 }))
					.setDescription(`${interaction.guild.description}\n${hideLinkEmbed('https://discord.gg/LMMS')}`)
					.addFields(
						{ name: 'Date Created', value: time(interaction.guild.createdAt), inline: false },
						{ name: 'Total Members', value: `${interaction.guild.memberCount}`, inline: true },
						{
							name: 'Online Members', value: `${interaction.guild.members.cache.filter(member =>
								member.presence?.status !== 'offline').size}`, inline: true
						},
						{ name: 'Maximum Members', value: `${interaction.guild.maximumMembers}`, inline: true },
						{ name: 'Boost Count', value: `${interaction.guild.premiumSubscriptionCount}`, inline: true },
						{ name: 'Boost Tier', value: `${interaction.guild.premiumTier}`, inline: true },
						{ name: 'Bans', value: `${bans.size}`, inline: true },
					);
				await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
			}

			// Bot info
			if (interaction.commandName === 'bot') {
				const changelog = fs.readFileSync('./changelog.txt', { 'encoding': 'utf-8' });
				const readme = fs.readFileSync('./README.md', { 'encoding': 'utf-8' });

				const embed = new EmbedBuilder()
					// .setColor(interaction.guild.me.displayHexColor)
					.setDescription(`**README.md:**\n\`\`\`md\n${readme.substring(0, 1000)}\n\`\`\`\n`
						+ changelog.substring(0, 1000));

				await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
			}

			// topic
			if (interaction.commandName === 'topic') {
				const embed = new EmbedBuilder()
					.setColor(this.colors.GREEN)
					.setDescription('No topic set for this channel.');
				if (interaction.channel.topic) embed.setDescription(interaction.channel.topic);
				await interaction.reply({ embeds: [embed] });
			}
		});
	}
}
