import { colors } from './colors.mjs';
import { THROW_REASONS } from "./globals.mjs";

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
	 * @param {{ disabled?: boolean } | undefined} config Configuration options
	 */
	constructor (client, name, description, config = { disabled: false }) {
		if (this.constructor == BotModule) throw new Error("Abstract classes can't be instantiated", { cause: THROW_REASONS.ABSTRACT_CLASS });
		this.client = client;

		this.name = name;
		this.description = description;
		this.disabled = config.disabled ?? false;
	}

	/**
	 * Abstract method for initializing the module. This module must be concretely implemented by subclasses else an error will be thrown
	 *
	 * @abstract
	 */
	init() {
		throw new Error("Method `init()` must be implemented by subclasses", { cause: THROW_REASONS.ABSTRACT_METHOD });
	}
}
