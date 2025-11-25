import { writeFile } from 'node:fs/promises';
import { BotModule } from './util/module.mjs';
import { config } from './util/config.mjs';
import configJson from "../config.json" with {type: 'json'};

export default class GreetModule extends BotModule {
	constructor () {
		super(
			'Greeting',
			'should only fire once, when `greeted` is unset/false in `config.json`',
			[],
			true
		);
	}
	/** @param {import('discord.js').Client} client */
	init(client) {
		(
			/** @param {import('discord.js').Channel | null} channel The channel's reference' */
			async (channel) => {
				if (typeof config.greeted === "boolean" && config.greeted) return;
				if (channel !== null && channel.isSendable()) {
					let cfgClone = Object.assign(configJson, { greeted: true });
					let cfgStringified = JSON.stringify(cfgClone, null, 2);

					channel.send("Hello world!");

					try {
						await writeFile('../config.json', cfgStringified);
					} catch (error) {
						console.error("Error writing to config file from Greeting module");
					}
				}
			})(client.channels.cache.get('434753275485618176') ?? null);
	}
}
