import { colors } from './colors.mjs';

export class BotModule {

	/**
	 * The reference to the client
	 *
	 * @type {import('discord.js').Client}
	 */
	client;

	/**
	 * Name of the module
	 *
	 * @type {string}
	 */
	name = "";

	/**
	 * The description of the module
	 *
	 * @type {string}
	 */
	description = "";

	/**
	 * What events the module listens to
	 *
	 * @type {string[]}
	 */
	listeners = [];

	/**
	 * Cached color object
	 *
	 * @type {typeof colors}
	 */
	colors = colors;

	/**
	 * Is the module disabled or not?
	 *
	 * @type {boolean}
	 */
	disabled = false;

	/**
	 * Constructs a bot module
	 * @abstract
	 * @param {import('discord.js').Client} client The bot client
	 * @param {string} name The name of the module
	 * @param {string} description The description of the module
	 * @param {string[]} listeners What events does the module listen to?
	 * @param {{ disabled?: boolean } | undefined} config Configuration options
	 */
	constructor (client, name, description, listeners, config = { disabled: false }) {
		if (this.constructor == BotModule) throw new Error("Abstract classes can't be instantiated");
		this.client = client;

		this.name = name;
		this.description = description;
		this.listeners = this.listeners.concat(listeners);
		this.disabled = config.disabled ?? false;
	}

	/**
	 * Abstract class for initializing the module.
	 *
	 * Analogous to the `.execute()` method
	 */
	init() {
		throw new Error("Method `init()` must be implemented by subclasses");
	}
}
