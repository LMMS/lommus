import { readFile } from 'node:fs/promises';
import { BotModule } from './util/module.mjs';
import { config } from './util/config.mjs';
import { ChatInputCommandInteraction, EmbedBuilder, Events, hideLinkEmbed, MessageFlags, PermissionFlagsBits, time } from 'discord.js';
import { LOMMUS } from '../lommus.js';
import { formatBytes } from 'bytes-formatter';

export default class SlashCommandsModule extends BotModule {

	/**
	 * Creates an instance of SlashCommandsModule.
	 *
	 * @constructor
	 * @param {import('discord.js').Client} client
	 */
	constructor (client) {
		super(
			client,
			"Slash Commands",
			"Event handlers for slash commands",
			["interactionCreate"]
		);
	}
	/**
	 * Checks whether the user has proper permissions, or is of the configured ID
	 *
	 * @param {import('discord.js').Interaction<import('discord.js').CacheType>} interaction The interaction to pass
	 * @param {import('discord.js').PermissionFlagsBits} bits The permission bits to check
	 * @param {string?} id The user ID to check
	 * @returns {boolean}
	 */
	checkPerms(interaction, bits, id) {
		if (id) {
			return (
				(interaction.memberPermissions?.has(bits) ?? false)
				|| (interaction.user.id === id)
			);
		} else {
			return interaction.memberPermissions?.has(bits) ?? false;
		}
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

	init() {
		this.client.on(Events.InteractionCreate, async (interaction) => {
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
						return await this.rejectUnprivilegedCommand(interaction);
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
						const embed = new EmbedBuilder()
							.setColor(this.colors.RED)
							.setTitle("MODULE RELOADING IS BROKEN")
							.setDescription('*Node currently does not refresh a module\'s dependency tree* even when it\'s imported again with cache busting. There is also a *memory leak with re-importing modules*.\n\nRestart the bot instead');
						await interaction.reply({ embeds: [embed] });
					} else {
						this.rejectUnprivilegedCommand(interaction);
					}
					break;
					/*
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
					*/
				}

				case 'whois': {
					// Get target user
					const interactionOption = interaction.options.getUser('user');
					if (!interactionOption) return;
					const targetUser = interaction.guild.members.cache.get(interactionOption.id);

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
							{ name: 'Most Recent Join', value: (targetUser.joinedAt) ? time(targetUser.joinedAt) : 'Unknown', inline: true },
							{ name: 'Account Registered', value: time(targetUser.user.createdAt), inline: true },
						);

					// Find, sort and display roles of target
					if (targetUser.roles.cache.size > 1) embed.addFields({
						name: 'Server Roles',
						value: targetUser.roles.cache
							.sort((a, b) => b.position - a.position)
							.map(r => `${r}`)
							.filter(f => f != '@everyone').join(', ')
					},
					);

					await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
					break;
				}

				case 'server': {
					const bans = await interaction.guild.bans.fetch();

					const embed = new EmbedBuilder()
						.setAuthor({
							name: interaction.guild.name,
							iconURL: interaction.guild.iconURL() ?? "",
						})
						// .setColor(interaction.guild.me.displayHexColor)
						.setThumbnail(interaction.guild.iconURL({ size: 128 }))
						.setDescription(`${(interaction.guild.description) ? interaction.guild.description.concat('\n') : ""}${hideLinkEmbed('https://discord.gg/LMMS')}`)
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
					break;
				}

				case 'bot': {
					const changelog = await readFile('./changelog.txt', { 'encoding': 'utf-8' });
					const readme = await readFile('./README.md', { 'encoding': 'utf-8' });

					const embed = new EmbedBuilder()
						// .setColor(interaction.guild.me.displayHexColor)
						.setDescription(`**README.md:**\n\`\`\`md\n${readme.substring(0, 1000)}\n\`\`\`\n`
							+ changelog.substring(0, 1000));

					await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
					break;
				}

				case 'topic': {
					const embed = new EmbedBuilder()
						.setColor(this.colors.GREEN)
						.setDescription('No topic set for this channel.');

					if ('topic' in interaction.channel) embed.setDescription(interaction.channel.topic);

					await interaction.reply({ embeds: [embed] });
					break;
				}

				case 'dump': {
					if (this.checkPerms(interaction, PermissionFlagsBits.KickMembers, config.ownerId)) {
						const loadedLOMMUSModules = Array.from(LOMMUS.registeredModules)
							.map((mod, i) => `${i + 1}. \`${mod.name}\`: *${mod.description}*`)
							.join('\n');

						const LOMMUSIntents = LOMMUS.client.options.intents
							.toArray()
							.map((intent, i) => `${i + 1}. \`${intent}\``)
							.join('\n');

						const embed = new EmbedBuilder()
							.setDescription(`\`config.json\`
															\`\`\`json\n${JSON.stringify(config, null, 2)}\`\`\``
							)
							.addFields([
								{ name: 'Loaded modules', value: loadedLOMMUSModules, inline: true },
								{ name: 'Intents', value: LOMMUSIntents, inline: true },
							])
							.setAuthor({ name: `${new Date().toISOString()}` })
							.setFooter({ text: `Mem usage (resident set size): ${formatBytes(process.memoryUsage().rss)}` });

						await interaction.reply({ embeds: [embed] });
					} else {
						await this.rejectUnprivilegedCommand(interaction);
					}
					break;
				}

				case 'ping': {
					const pingReceivedTime = Date.now();

					if (interaction.isRepliable()) try {
						interaction.reply('Measuring...').then(async (msg) => {
							await msg.edit(`:ping_pong: Pong \`${pingReceivedTime - msg.createdTimestamp}\`ms\nAPI latency: \`${this.client.ws.ping}\`ms\nTotal latency: \`${this.client.ws.ping + (pingReceivedTime - msg.createdTimestamp)}\`ms`);
						});
					} catch (error) {
						await interaction.reply('Failed to get ping data');
					}

					break;
				}
			}
		});
	}
}
