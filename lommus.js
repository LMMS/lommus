import * as dotenv from 'dotenv';
dotenv.config({ path: __dirname.concat('/.env'), quiet: true });
import { ActivityType, Client, Collection, EmbedBuilder, Events, GatewayIntentBits, Partials } from 'discord.js';
import fs from 'node:fs';
import config from './config.json' with { type: 'json' };

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
	 * Cache color configuration here + TS assertions
	 * @constant
	 */
	colors = {
		RED: /** @type {`#${string}`} */ (config.red),
		GREEN: /** @type {`#${string}`} */ (config.green)
	};

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
	 * Loads CommonJS-style modules from the `./modules` directory.
	 */
	loadCJSModules() {
		// Collect module files from directory
		this.client.addons = new Collection();
		const addonFiles = fs.readdirSync('./modules').filter(file => file.endsWith('.mjs'));
		// Loop Collection of module files
		for (const file of addonFiles) {
			// Map
			const addon = require(`./modules/${file}`);
			this.client.addons.set(addon.name, addon);

			// Execute module.export code from module files
			try {
				this.client.addons.get(addon.name).execute(this.client);
				console.log(addon.name + ' module loaded.');
			}
			catch (error) {
				console.error(error);
			}
		}
		console.log("Module loading done!");
	}

	/**
	 * Sets up initial authentication and bot
	 * logic, including CJS module loading
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
			this.loadCJSModules();
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

			// Restart bot
			if (interaction.commandName === 'restart') {
				const embed = new EmbedBuilder()
					.setAuthor({ name: 'Restarting', iconURL: interaction.guild.iconURL({ size: 64 }) })
					.setColor(this.colors.RED)
					.setDescription('Was I a Good Bot?');

				await interaction.reply({ embeds: [embed], ephemeral: true })
					// Exit process, loop.sh container will restart bot automatically
					.then(async () => {
						console.log("Exiting...");
						process.exit(0);
					})
					.catch(error => {
						console.error('Unable to restart!', error);
					});
			}

			// Chat as bot
			if (interaction.commandName === 'say') {
				const msg = interaction.options.getString('message') ?? "";

				// @ts-ignore
				await interaction.channel.send({ content: msg });
			}

			// Toggle various global booleans
			if (interaction.commandName === 'toggle') {
				const toggleType = interaction.options.getString('function');
				// Color randomization toggle
				if (toggleType === 'toggle_color') {
					// flip
					global.colorRandom = !global.colorRandom;

					const embed = new EmbedBuilder()
						.setColor(this.colors.RED)
						.setDescription('Color randomization disabled.');
					if (global.colorRandom) {
						embed.setColor(this.colors.GREEN);
						embed.setDescription('Color randomization enabled.');
					}
					await interaction.reply({ embeds: [embed], ephemeral: true });
				}
			}
		});
		console.log("Slash command setup done!");
	}
}

// generic error handling
process.on('unhandledRejection', (error) => console.error('Uncaught Promise rejection:\n', error));

// final token check
(process.env.TOKEN) ? new LoMMuS(process.env.TOKEN) : console.error("Token not found in env!");
