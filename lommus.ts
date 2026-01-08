import fs from 'node:fs';

import * as dotenv from 'dotenv';
dotenv.config({ quiet: true });
import { ActivityType, Client, Events, GatewayIntentBits, Partials } from 'discord.js';
import { config } from './modules/util/config.mjs';
import { THROW_REASONS } from './modules/util/globals.mjs';
import { BotModule } from './modules/util/module.mjs';

console.log("LoMMuS is initializing...");

class LoMMuS {
	/**
	 * The client class instantiated and cached
	 */
	client: Client = new Client({
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
	 */
	_isModuleLoadingDone: boolean = false;

	/** Array of module names that have been loaded and registered */
	registeredModules = new Set<BotModule>();

	/**
	 * Initializes LoMMuS and logs in
	 *
	 * @param token The bot token
	 */
	constructor(token: string) {
		console.log("Instantiating LoMMuS...");
		this.setupBot();
		this.client.login(token);
	}

	/** Loads ES-style modules from the `./modules` directory */
	async loadESModules() {
		console.log("Initializing ES module loading...");

		const moduleFiles = fs
			.readdirSync('./modules')
			.filter(file => file.endsWith('.mts') || file.endsWith('.mjs'));

		for (const file of moduleFiles) {
			// cachebust
			const path = `./modules/${file}?t=${Date.now()}`;
			let mod;

			// try to import the module first
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

			let instance: InstanceType<typeof BotModule>;

			try {
				instance = new mod.default(this.client);
				if (instance.disabled) {
					console.warn(`Module '${file}' is disabled, skipping.`);
					continue;
				};
			} catch (err) {
				console.warn(`Ignoring '${file}'. Could not instantiate default export due to:`, err);
				continue;
			}

			try {
				this.#checkLoadedModules(instance);
				instance.init();
				console.log(`'${instance.name}' module loaded`);
			} catch (err) {
				console.error(`Error while initializing '${file}':`, err);
				if (err instanceof Error) {
					if (err.cause === THROW_REASONS.ABSTRACT_METHOD) return console.error(`Module ${file}'s 'init()' method was not implemented`);
				}
			}
		}
	}

	/**
	 * Checks all of the modules that have been loaded
	 *
	 * @param moduleName The name of the module
	 */
	#checkLoadedModules(moduleName: BotModule) {
		if (this.registeredModules.has(moduleName)) throw new Error(`Module ${moduleName.name} was attempted to load more than once!`);

		this.registeredModules.add(moduleName);
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
			await this.loadESModules();
		});
	}
}

// async error handling
process.on('unhandledRejection', (error) => console.error('Uncaught Promise rejection:\n', error));

// process crash handling
process.on('uncaughtException', (error) => {
	console.error('Unhandled fatal exception:\n', error);
	console.error('This is irrecoverable. The process will exit with code \'1\'. If any, the daemon will restart LoMMuS');
	process.exit(1);
});

// final token check
if (!process.env.TOKEN) throw new Error("Token not found in env!")

export const LOMMUS = new LoMMuS(process.env.TOKEN)
