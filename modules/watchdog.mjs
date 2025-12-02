import { EmbedBuilder, Events, PermissionFlagsBits } from 'discord.js';
import { setTimeout as wait } from 'node:timers/promises';
import { BotModule } from './util/module.mjs';

export default class WatchdogModule extends BotModule {
	/**
	 * The RegExp for URLs
	 */
	urlReg = RegExp(/https?:\/\/\w+/, "i");

	/**
	 * The string ID of the #resources channel
	 *
	 * @type {string}
	 */
	resourcesChannelId = "836022138913816586";

	/**
	 * Creates an instance of WatchdogModule.
	 *
	 * @constructor
	 * @param {import('discord.js').Client} client
	 */
	constructor (client) {
		super(
			client,
			'Watchdog',
			"oh no you didn't.",
			['messageCreate']
		);
	}

	init() {
		this.client.on(Events.MessageCreate, async (message) => {
			if (message.author.bot) return;

			// #resouces image/link handler
			if (message.channelId === this.resourcesChannelId) {
				// is it a staff? does it have no url and attachments?
				if (
					(
						message.member
						&& message.member.permissions.has(PermissionFlagsBits.BanMembers)
					)
					|| !this.urlReg.test(message.content)
					&& message.attachments.size > 0
				) {
					message.react('✅');
				}
				else {
					message.delete();
					const embed = new EmbedBuilder()
						.setColor(this.colors.RED)
						.setDescription('This channel is for sharing presets, samples, and LMMS themes you have the legal rights to share. This is not a discussion or request channel. Please do not share binaries or links to external resources.');

					message.channel.send({ embeds: [embed] })
						.then(async sentMessage => {
							await wait(10000);
							sentMessage.delete();
						});
				}
			}
		});
	}
}
