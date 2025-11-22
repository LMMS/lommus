import fs from 'node:fs';

import * as dotenv from 'dotenv';
dotenv.config({ quiet: true });
import { ActivityType, Client, EmbedBuilder, Events, GatewayIntentBits, MessageFlags, Partials } from 'discord.js';
import { colors } from './modules/util/colors.mjs';
import { config } from './modules/util/config.mjs';

console.log("LoMMuS is initializing...");

class LoMMuS {
	/**
	 * The client class instantiated and cached
	 * @type {Client}
	 */
	client = new Client({
		intents: [
			GatewayIntentBits.Guilds,
			GatewayIntentBits.GuildMembers,
			GatewayIntentBits.GuildMessages,
			GatewayIntentBits.GuildModeration,
			GatewayIntentBits.GuildMessageReactions,
			GatewayIntentBits.MessageContent,
			GatewayIntentBits.DirectMessages,
		],
		partials: [
			Partials.Message,
			Partials.Channel,
			Partials.Reaction,
		],
	});

	/**
	 * Has the client finished doing module loading?
	 *
	 * @type {boolean}
	 */
	_isModuleLoadingDone = false;

	/**
	 * Array of module names that have been loaded and registered
	 *
	 * @type {string[]}
	 */
	registeredModules = [];

	/**
	 * Initializes LoMMuS and logs in
	 * @param {string} token
	 */
	constructor (token) {
		console.log("Instantiating LoMMuS...");
		this.setupBot();
		this.setupSlashCommands();
		this.client.login(token);
	}

	/**
	 * Loads ES-style modules from the `./modules` directory
	 */
	async loadESModules() {
		console.log("Initializing ES module loading...");

		const moduleFiles = fs
			.readdirSync('./modules')
			.filter(file => file.endsWith('.mjs'));

		for (const file of moduleFiles) {
			// cachebust
			const path = `./modules/${file}?t=${Date.now()}`;
			let mod;

			// try to import this first
			try {
				mod = await import(path);
			} catch (err) {
				console.error(`Failed to import ${file}:`, err);
				continue;
			}

			if (typeof mod.default !== 'function') {
				console.warn(`Ignoring '${file}' as the default export is not a constructor`);
				continue;
			}

			/** @type {InstanceType<typeof import('./modules/util/module.mjs').BotModule>} */
			let instance;

			try {
				instance = new mod.default();
			} catch (err) {
				console.warn(`Ignoring '${file}', could not instantiate default export`);
				continue;
			}

			try {
				instance.init(this.client);
				this.#checkLoadedModules(instance.name);
				console.log(`'${instance.name}' module loaded`);
			} catch (err) {
				console.error(`Error initializing '${file}':`, err);
			}
		}
	}

	/**
	 * Checks all of the modules that have been loaded
	 *
	 * @param {string} moduleName The name of the module
	 */
	#checkLoadedModules(moduleName) {
		if (!this.registeredModules.includes(moduleName)) this.registeredModules.push((moduleName));
	}

	/**
	 * Sets up initial authentication and bot logic
	 */
	setupBot() {
		// Fires when bot successfully authenticates via token
		this.client.once(Events.ClientReady, async () => {
			// Get guild from client in order to set initial activity status
			const guild = this.client.guilds.cache.get(config.guildId);

			if (!this.client.user) {
				console.error("client.user not defined! Did the authentication fail?");
				return;
			}

			if (!guild) {
				console.error("guild is not defined! Is the bot joined to any server?");
				return;
			}

			console.log(`Ready! Logged in as ${this.client.user.tag}`);

			this.client.user.setActivity(`${guild.memberCount} LeMMingS`, { type: ActivityType.Watching });

			// This needs to be called here so that the guild data cache isn't stale
			this.loadESModules();
		});

		console.log("Initial bot setup done!");
	}

	/**
	 * Sets up slash command logic
	 */
	setupSlashCommands() {
		// Fires once for each slash command sent by users
		this.client.on(Events.InteractionCreate, async (interaction) => {
			if (!interaction || !interaction.channel || !interaction.guild) {
				console.error("Interaction is not configured correctly! Has slash commands been registered yet?");
				return;
			}

			// Screen bad command interactions
			if (!interaction.isChatInputCommand()) return;

			switch (interaction.commandName) {
				case 'restart': {
					console.log("Restarting...");
					const embed = new EmbedBuilder()
						.setAuthor({ name: 'Restarting', iconURL: interaction.guild.iconURL({ size: 64 }) ?? "" })
						.setColor(colors.RED)
						.setDescription('Bot is restarting. Please wait a few seconds for the bot to reload everything');

					await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
						.then(async () => {
							setTimeout(() => process.exit(1), 1000);
						})
						.catch(error => {
							throw new Error(`Unable to restart properly! ${error}`);
						});
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
					console.log("Killing bot...");

					const embed = new EmbedBuilder()
						.setAuthor({ name: 'Exiting bot', iconURL: interaction.guild.iconURL({ size: 64 }) ?? "" })
						.setColor(colors.RED)
						.setDescription('Goodbye world.');

					await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
						.then(async () => {
							setTimeout(() => process.exit(0), 10);
						});
					break;
				}
				case 'reload': {
					console.log("Reloading modules...");

					const embed = new EmbedBuilder()
						.setAuthor({ name: 'Reloading modules', iconURL: interaction.guild.iconURL({ size: 64 }) ?? "" })
						.setColor(colors.GRAY)
						.setDescription('Reloading modules. Please wait a few seconds for all modules to be reloaded');
					await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
					break;
				}
			}
		});
		console.log("Slash command setup done!");
	}
}

// generic error handling
process.on('unhandledRejection', (error) => console.error('Uncaught Promise rejection:\n', error));

// final token check
export const LOMMUS = (process.env.TOKEN) ? new LoMMuS(process.env.TOKEN) : console.error("Token not found in env!");
