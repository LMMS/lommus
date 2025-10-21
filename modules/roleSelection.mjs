import { EmbedBuilder, Events, ActionRowBuilder, StringSelectMenuBuilder, ButtonStyle, ButtonBuilder } from 'discord.js';
// const { guildId, green } = require('../config.json');
import config from '../config.json' with { type: 'json' };
import { BotModule } from './util/module.mjs';

export default class RoleSelectionModule extends BotModule {
	/**
	 * Cache color configuration here + TS assertions
	 * @constant
	 */
	colors = {
		RED: /** @type {`#${string}`} */ (config.red),
		GREEN: /** @type {`#${string}`} */ (config.green)
	};

	guildId = config.guildId;

	constructor () {
		super(
			'Role Selector',
			'Enables role selection.',
			['interactionCreate']
		);
	}

	async roleColor(interaction) {
		if (global.colorRandom === false) {
			const embed = new EmbedBuilder()
				.setColor(this.colors.GREEN)
				.setDescription('**Here are your color options:**\n' + roleMap);

			const select = new StringSelectMenuBuilder()
				.setCustomId('select')
				.setPlaceholder('Pick a color')
				.addOptions(
					roleArray.map((role, index) => {
						return {
							label: role.name,
							value: index,
						};
					}),
				);

			const selectRow = new ActionRowBuilder()
				.addComponents(select);

			const ifColor = interaction.member.roles.cache.some(role => role.name.startsWith('🎨'));

			const random = new ButtonBuilder()
				.setCustomId('random')
				.setLabel('Randomizer')
				.setStyle(ButtonStyle.Primary);

			const clear = new ButtonBuilder()
				.setCustomId('clear')
				.setLabel('Remove Color Role')
				.setStyle(ButtonStyle.Danger)
				.setDisabled(!ifColor);

			const buttonRow = new ActionRowBuilder()
				.addComponents(random, clear);

			await interaction.reply({ embeds: [embed], components: [selectRow, buttonRow], ephemeral: true });
		}
		else {
			const embed = new EmbedBuilder()
				.setColor(this.colors.GREEN)
				.setDescription('There is no color in LMMS server.');
			return await interaction.reply({ embeds: [embed], ephemeral: true });
		}
	}

	/** @param {import('discord.js').Client} client */
	init(client) {
		const guild = client.guilds.cache.get(this.guildId);
		global.colorRandom = false;

		const roleArray = guild.roles.cache
			.filter(role => role.name.startsWith('🎨'))
			.sort((a, b) => b.position - a.position);
		let roleMap = roleArray
			.map(r => r)
			.join('\n');
		if (roleMap.length > 4000) roleMap = 'Too many roles to display';
		if (!roleMap) roleMap = 'No roles';

		client.on(Events.InteractionCreate, async (interaction) => {
			if (interaction.isStringSelectMenu()) {
				if (interaction.customId === 'select') {
					const embed = new EmbedBuilder()
						.setColor(this.colors.GREEN)
						.setDescription(`You changed your color to <@&${interaction.values[0]}>.`);

					await interaction.member.roles.remove(roleArray.map(role => { return role.id; }));
					await interaction.member.roles.add(interaction.values);
					await interaction.update({ embeds: [embed], components: [], ephemeral: true });
				}
			}

			if (interaction.isButton()) {
				// THIS IS FIRED FROM INFOEMBED.JS GENERATED EMBED
				if (interaction.customId === 'roles') {
					this.roleColor(interaction);
				}
				if (interaction.customId === 'clear') {
					await interaction.member.roles.remove(roleArray.map(role => { return role.id; }));
					const embed = new EmbedBuilder()
						.setColor(this.colors.GREEN)
						.setDescription('You removed your color role.');
					return await interaction.update({ embeds: [embed], components: [], ephemeral: true });
				}
				if (interaction.customId === 'random') {
					const addRole = roleArray.random();
					const embed = new EmbedBuilder()
						.setColor(this.colors.GREEN)
						.setDescription(`You look good in ${addRole}.`);

					await interaction.member.roles.remove(roleArray.map(role => { return role.id; }));
					await interaction.member.roles.add(addRole);

					const reroll = new ButtonBuilder()
						.setCustomId('random')
						.setLabel('Reroll')
						.setStyle(ButtonStyle.Primary);

					const row = new ActionRowBuilder()
						.addComponents(reroll);

					await interaction.update({ embeds: [embed], components: [row], ephemeral: true });
				}
			}

			if (interaction.isChatInputCommand()) {
				if (interaction.commandName === 'color') {
					this.roleColor(interaction);
				}
			}
		});

		client.on(Events.MessageCreate, async message => {
			if (message.author.bot) return;

			if (global.colorRandom === true) {
				const ifColor = await message.member.roles.cache
					.filter(role => role.name.startsWith('🎨'));

				const addRole = roleArray.random();
				await message.member.roles.add(addRole);

				if (ifColor && !ifColor.some(role => role === addRole)) {
					await message.member.roles.remove(ifColor.map(role => { return role.id; }));
				}
			}
		});
	}
}
