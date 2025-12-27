import { readFile } from 'node:fs/promises';
import { BotModule } from './util/module.mjs';
import { config } from './util/config.mjs';
import { ChannelType, ChatInputCommandInteraction, EmbedBuilder, Events, hideLinkEmbed, MessageFlags, PermissionFlagsBits, time } from 'discord.js';
import { LOMMUS } from '../lommus.js';
import { formatBytes } from 'bytes-formatter';
import { getGitHubFile } from './util/githubApi.mjs';

/**
 * @typedef {ReadonlyMap<string, {
 * perms: bigint;
 * bypassUserIds: string[];
 * handler: (
 * interaction: import("discord.js").ChatInputCommandInteraction<import("discord.js").CacheType>
 * ) => *;
 * }>} CommandStruct
 */
export default class SlashCommandsModule extends BotModule {

	/**
	 * The #evidence channel ID
	 *
	 * @type {string}
	 */
	evidenceChannelId = "486590751032082462";

	/**
	 * The #evidence channel
	 *
	 * @type {import('discord.js').TextChannel}
	 */
	evidenceChannel;

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

		// @ts-expect-error
		this.evidenceChannel = this.client.channels.cache.get(this.evidenceChannelId);
		if (this.evidenceChannel?.partial) this.evidenceChannel.fetch();
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

		interaction.reply({ content: "You do not have the permissions to use this command! This incident will be reported.", flags: MessageFlags.Ephemeral });

		return await this.evidenceChannel.send(`${new Date().toISOString()} Unprivileged user tried to run command '${interaction.commandName}': [${id}] ${username} (${globalName})`);
	}

	/** @type {CommandStruct} */
	commandList = new Map([
		["restart", {
			perms: PermissionFlagsBits.BanMembers,
			bypassUserIds: [config.ownerId],
			handler: async (interaction) => {
				console.log("Restarting...");

				if (!interaction.channel || !interaction.guild) return;

				const embed = new EmbedBuilder()
					.setAuthor({ name: 'Restarting', iconURL: interaction.guild.iconURL({ size: 64 }) ?? "" })
					.setColor(this.colors.RED)
					.setDescription('Bot is restarting. Please wait a few seconds for the bot to reload everything');

				// if we can reply, do it
				// if not, leave it be
				if (interaction.isRepliable()) await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

				return setTimeout(() => process.exit(1), 1000);
			}
		}],
		["say", {
			perms: PermissionFlagsBits.KickMembers,
			bypassUserIds: [config.ownerId],
			handler: async (interaction) => {
				if (
					!interaction.channel?.isSendable()
					|| !interaction.isRepliable()
				) return;

				const options = {
					msg: interaction.options.getString('message', true),
					channel: interaction.options.getChannel('channel', false) ?? interaction.channel
				};

				if (
					options.channel.type !== ChannelType.GuildText
					// @ts-ignore
					|| !options.channel?.isSendable()
				) return await interaction.reply({
					content: "I can't send messages in that channel",
					flags: MessageFlags.Ephemeral
				});

				await interaction.deferReply({ flags: MessageFlags.Ephemeral });

				// @ts-expect-error
				await options.channel.send(options.msg);

				return interaction.deleteReply();
			}
		}],
		["toggle", {
			perms: PermissionFlagsBits.Administrator,
			bypassUserIds: [config.ownerId],
			handler: async (interaction) => {
				if (!interaction.isChatInputCommand()) return;

				const toggleType = interaction.options.getString('function');

				// noop for now
				return;
			}
		}],
		["kill", {
			perms: PermissionFlagsBits.BanMembers,
			bypassUserIds: [config.ownerId],
			handler: async (interaction) => {
				console.log("Killing bot...");
				if (!interaction.isChatInputCommand()) return;

				const embed = new EmbedBuilder()
					.setAuthor({ name: 'Exiting bot', iconURL: (interaction.guild) ? interaction.guild.iconURL({ size: 64 }) ?? "" : "" })
					.setColor(this.colors.RED)
					.setDescription('Goodbye world.');

				await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

				return setTimeout(() => process.exit(0), 10);
			}
		}],
		["reload", {
			perms: PermissionFlagsBits.KickMembers,
			bypassUserIds: [config.ownerId],
			handler: async (interaction) => {
				const embed = new EmbedBuilder()
					.setColor(this.colors.RED)
					.setTitle("MODULE RELOADING IS BROKEN")
					.setDescription('*Node currently does not refresh a module\'s dependency tree* even when it\'s imported again with cache busting. There is also a *memory leak with re-importing modules*.\n\nRestart the bot instead');

				return await interaction.reply({ embeds: [embed] });
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
		}],
		["whois", {
			perms: PermissionFlagsBits.SendMessages,
			bypassUserIds: [config.ownerId],
			handler: async (interaction) => {
				// Get target user
				const interactionOption = interaction.options.getUser('user');
				if (!interactionOption || !interaction.guild) return;
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
				});

				return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
			}
		}],
		["server", {
			perms: PermissionFlagsBits.SendMessages,
			bypassUserIds: [config.ownerId],
			handler: async (interaction) => {
				if (!interaction.guild) return;

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

				return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
			}
		}],
		["bot", {
			perms: PermissionFlagsBits.SendMessages,
			bypassUserIds: [config.ownerId],
			handler: async (interaction) => {
				const changelog = await readFile('./changelog.txt', { 'encoding': 'utf-8' });
				const readme = await readFile('./README.md', { 'encoding': 'utf-8' });

				const embed = new EmbedBuilder()
					// .setColor(interaction.guild.me.displayHexColor)
					.setDescription(`**README.md:**\n\`\`\`md\n${readme.substring(0, 1000)}\n\`\`\`\n`
						+ changelog.substring(0, 1000));

				return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
			}
		}],
		["topic", {
			perms: PermissionFlagsBits.SendMessages,
			bypassUserIds: [config.ownerId],
			handler: async (interaction) => {
				const embed = new EmbedBuilder()
					.setColor(this.colors.GREEN)
					.setDescription('No topic set for this channel.');

				if (interaction.channel && 'topic' in interaction.channel) embed.setDescription(interaction.channel.topic);

				return await interaction.reply({ embeds: [embed] });
			}
		}],
		["dump", {
			perms: PermissionFlagsBits.KickMembers,
			bypassUserIds: [config.ownerId],
			handler: async (interaction) => {
				{
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
				}
			}
		}],
		["ping", {
			perms: PermissionFlagsBits.SendMessages,
			bypassUserIds: [config.ownerId],
			handler: async (interaction) => {
				const pingReceivedTime = Date.now();

				if (interaction.isRepliable()) try {
					interaction.reply('Measuring...').then(async (msg) => {
						await msg.edit(`:ping_pong: Pong \`${pingReceivedTime - msg.createdTimestamp}\`ms\nAPI latency: \`${this.client.ws.ping}\`ms\nTotal latency: \`${this.client.ws.ping + (pingReceivedTime - msg.createdTimestamp)}\`ms`);
					});
				} catch (error) {
					await interaction.reply('Failed to get ping data');
				}
			}
		}],
		["nightly", {
			perms: PermissionFlagsBits.SendMessages,
			bypassUserIds: [config.ownerId],
			handler: async (interaction) => {
				await interaction.deferReply({ flags: MessageFlags.Ephemeral });

				const embed = new EmbedBuilder()
					.setColor(this.colors.GREEN)
					.setTitle('Nightly builds')
					.setURL('https://lmms.io/download')
					.setDescription('Nightly versions are now available directly on the main LMMS download page! \n[Go to download page.](https://lmms.io/download) \n\nTreat nightly builds with utmost care. Back up any projects before loading and saving them in new versions.');

				if (interaction.channel?.isSendable()) await interaction.channel.send({ embeds: [embed] });

				await interaction.deleteReply();
			}
		}],
		["file", {
			perms: PermissionFlagsBits.SendMessages,
			bypassUserIds: [config.ownerId],
			handler: async (interaction) => {
				const options = {
					orgPlusRepo: interaction.options.getString('org') ?? 'LMMS',
					repo: interaction.options.getString('repo') ?? 'lmms',
					filePath: interaction.options.getString('path', true)
				};

				const maybeOrgPlusRepo = options.orgPlusRepo.split('/');
				if (maybeOrgPlusRepo.length > 1)
					// @ts-expect-error
					[options.orgPlusRepo, options.repo] = maybeOrgPlusRepo;
				const fileOrNum = await getGitHubFile(options.orgPlusRepo, options.repo, options.filePath);


				if (typeof fileOrNum === 'number') {
					let httpRejectReason;
					switch (fileOrNum) {
						case 429:
							httpRejectReason = "Hold your horses, the GitHub API is not pleased.";
							break;

						case 403:
							httpRejectReason = "LoMMuS cannot access the given resource";
							break;

						case 404:
							httpRejectReason = "Not found. Please re-check your options";
							break;

						default:
							httpRejectReason = "There was an HTTP rejection/failure on your request";
							break;
					}

					const embed = new EmbedBuilder()
						.setTitle(`HTTP ${fileOrNum}`)
						.setDescription(httpRejectReason)
						.setColor(this.colors.RED);

					return interaction.reply({ embeds: [embed] });
				}

				const maybeFileExt = options.filePath.split('.');
				const fileType = (maybeFileExt.length > 1) ? maybeFileExt.at(-1) : '';

				const embed = new EmbedBuilder()
					.setTitle(`(${options.orgPlusRepo}/${options.repo}) ${fileOrNum.name}`)
					.setURL(fileOrNum.link)
					.setDescription(`\`\`\`${fileType}\n${fileOrNum.contents}\n...\`\`\``)
					.setColor(this.colors.GREEN)
					.addFields([
						{ name: 'Path', value: `\`${fileOrNum.path}\`` },
						{ name: 'Size (b)', value: fileOrNum.size.toString(), inline: true },
						{ name: 'SHA-1', value: `\`${fileOrNum.sha}\``, inline: true }
					]);

				return interaction.reply({ embeds: [embed] });
			}
		}]
	]);

	init() {
		this.client.on(Events.InteractionCreate, async (interaction) => {
			if (!interaction || !interaction.channel || !interaction.guild) {
				console.error("Interaction is not configured correctly! Has slash commands been registered yet?");
				return;
			}

			// Screen bad command interactions
			if (!interaction.isChatInputCommand()) return;

			const cmd = this.commandList.get(interaction.commandName);
			if (!cmd) return;

			if (interaction.memberPermissions?.has(cmd.perms) || cmd.bypassUserIds.includes(interaction.user.id)) {
				cmd.handler(interaction);
			} else {
				this.rejectUnprivilegedCommand(interaction);
			};
		});
	}
}
