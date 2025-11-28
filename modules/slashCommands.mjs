import { BotModule } from './util/module.mjs';
import { config } from './util/config.mjs';
import { ChatInputCommandInteraction, EmbedBuilder, Events, MessageFlags, PermissionFlagsBits } from 'discord.js';
import { LOMMUS } from '../lommus.js';

export default class SlashCommandsModule extends BotModule {
	constructor () {
		super(
			"Slash commands",
			"Event handlers for slash commands",
			["interactionCreate"]
		);
	}
	/**
	 * Checks whether the user has proper permissions, or is of the configured ID
	 *
	 * @param {import('discord.js').Interaction<import('discord.js').CacheType>} interaction The interaction to pass
	 * @param {import('discord.js').PermissionFlagsBits} bits The permission bits to check
	 * @param {string} id The user ID to check
	 * @returns {boolean}
	 */
	checkPerms(interaction, bits, id) {
		return (
			interaction.memberPermissions?.has(bits)
			|| (interaction.user.id === id)
		);
	}

	/**
	 * Rejects a given command interaction
	 *
	 * @param {ChatInputCommandInteraction<import('discord.js').CacheType>} interaction The interaction to pass here
	 */
	async rejectUnprivilegedCommand(interaction) {
		const { id, globalName, username } = interaction.user;

		await interaction.reply({ content: "You do not have the permissions to use this command! This incident will be reported.", flags: MessageFlags.Ephemeral });

		console.warn(`Unprivileged user tried to run command '${interaction.commandName}': [${id}] ${username} (${globalName})`);
	}

	/** @param {import('discord.js').Client} client */
	init(client) {
		client.on(Events.InteractionCreate, async (interaction) => {
			if (!interaction || !interaction.channel || !interaction.guild) {
				console.error("Interaction is not configured correctly! Has slash commands been registered yet?");
				return;
			}

			// Screen bad command interactions
			if (!interaction.isChatInputCommand()) return;

			switch (interaction.commandName) {
				case 'restart': {
					if (this.checkPerms(interaction, PermissionFlagsBits.BanMembers, config.ownerId)) {
						console.log("Restarting...");

						const embed = new EmbedBuilder()
							.setAuthor({ name: 'Restarting', iconURL: interaction.guild.iconURL({ size: 64 }) ?? "" })
							.setColor(this.colors.RED)
							.setDescription('Bot is restarting. Please wait a few seconds for the bot to reload everything');

						await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

						setTimeout(() => process.exit(1), 1000);
					} else {
						await this.rejectUnprivilegedCommand(interaction);
					}
					break;
				}

				case 'say': {
					const msg = interaction.options.getString('message') ?? "";

					interaction.reply({ content: 'Message said', flags: MessageFlags.Ephemeral });
					// @ts-ignore
					await interaction.channel.send({ content: msg });
					break;
				}

				case 'toggle': {
					const toggleType = interaction.options.getString('function');

					// noop for now
					break;
				}

				case 'kill': {
					if (this.checkPerms(interaction, PermissionFlagsBits.BanMembers, config.ownerId)) {
						console.log("Killing bot...");

						const embed = new EmbedBuilder()
							.setAuthor({ name: 'Exiting bot', iconURL: interaction.guild.iconURL({ size: 64 }) ?? "" })
							.setColor(this.colors.RED)
							.setDescription('Goodbye world.');

						await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
							.then(async () => {
								setTimeout(() => process.exit(0), 10);
							});
					} else {
						this.rejectUnprivilegedCommand(interaction);
					}
					break;
				}

				case 'reload': {
					if (this.checkPerms(interaction, PermissionFlagsBits.BanMembers, config.ownerId)) {
						console.log("Reloading modules...");

						const embed = new EmbedBuilder()
							.setAuthor({ name: 'Reloading modules', iconURL: interaction.guild.iconURL({ size: 64 }) ?? "" })
							.setColor(this.colors.GRAY)
							.setDescription('Reloading modules. Please wait a few seconds for all modules to be reloaded');

						await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

						await LOMMUS.loadESModules();
					} else {
						this.rejectUnprivilegedCommand(interaction);
					}
					break;
				}
			}
		});
	}
}
