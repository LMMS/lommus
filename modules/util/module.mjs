import { colors } from './colors.mjs';

export class BotModule {
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
	 * @param {string} name The name of the module
	 * @param {string} description The description of the module
	 * @param {string[]} listeners What events does the module listen to?
	 * @param {{ disabled?: boolean } | undefined} config Configuration options
	 */
	constructor (name, description, listeners, config = { disabled: false }) {
		if (this.constructor == BotModule) throw new Error("Abstract classes can't be instantiated");
		this.name = name;
		this.description = description;
		this.listeners = this.listeners.concat(listeners);
		this.disabled = config.disabled ?? false;
	}

	/**
	 * Abstract class for initializing the module.
	 *
	 * Analogous to the `.execute()` method
	 * @param {import('discord.js').Client} client
	 */
	init(client) {
		throw new Error("Method `init()` must be implemented by subclasses");
	}
}
