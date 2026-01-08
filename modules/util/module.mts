import { colors } from './colors.mjs';
import { THROW_REASONS } from "./globals.mjs";
import { Client } from 'discord.js';
import type { ColorResolvable } from 'discord.js'

export abstract class BotModule {
	/** The reference to the client */
	client: Client;

	/** Name of the module */
	name: string = "";

	/** The description of the module */
	description: string = "";

	/** Cached color object */
	colors: typeof colors = colors;

	/** Is the module disabled or not? */
	disabled: boolean = false;

	/**
	 * Constructs a bot module
	 *
	 * @param client The bot client
	 * @param name The name of the module
	 * @param description The description of the module
	 * @param config Configuration options
	 */
	constructor(
		client: Client,
		name: string,
		description: string,
		config: { disabled: boolean } | undefined = { disabled: false }
	) {
		this.client = client;
		this.name = name;
		this.description = description;
		this.disabled = config.disabled ?? false;
	}

	/** Abstract method for initializing the module. This module must be concretely implemented by subclasses else an error will be thrown */
	public abstract init(): void;
}
