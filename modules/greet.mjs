import { writeFileSync } from 'node:fs';
import { BotModule } from './util/module.mjs';
import { config } from './util/config.mjs';
import configJson from "../config.json" with {type: 'json'};

export default class GreetModule extends BotModule {

	/**
	 * Creates an instance of GreetModule.
	 *
	 * @constructor
	 * @param {import('discord.js').Client} client
	 */
	constructor (client) {
		super(
			client,
			'Greeting',
			'should only fire once, when `greeted` is unset/false in `config.json`',
			[],
			{ disabled: true }
		);
	}

	init() {
		const channel = this.client.channels.cache.get('434753275485618176') ?? null;

		if (typeof config.greeted === "boolean" && config.greeted) return;

		if (channel !== null && channel.isSendable()) {
			let cfgClone = Object.assign(configJson, { greeted: true });
			let cfgStringified = JSON.stringify(cfgClone, null, 2);

			channel.send("Hello world!");

			try {
				writeFileSync('../config.json', cfgStringified);
			} catch (error) {
				console.error("Error writing to config file from Greeting module");
			}
		}
	}
}
