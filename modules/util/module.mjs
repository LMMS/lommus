export class BotModule {
	name = "";
	description = "";
	listeners = [""];

	/**
	 * Constructs a bot module
	 * @abstract
	 * @param {string} name The name of the module
	 * @param {string} description The description of the module
	 * @param {string[]} listeners What events does the module listen to?
	 */
	constructor (name, description, listeners) {
		if (this.constructor == BotModule) throw new Error("Abstract classes can't be instantiated");
		this.name = name;
		this.description = description;
		this.listeners = this.listeners.concat(listeners);
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
