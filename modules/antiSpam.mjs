import { blockQuote, EmbedBuilder, Events, Message, PermissionFlagsBits } from 'discord.js';
import { BotModule } from './util/module.mjs';
import badURLs from '../data/spam.json' with { type: 'json' };
import { config } from './util/config.mjs';

export default class AntiSpamModule extends BotModule {
	/**
	 * The RegExp for URLs
	 *
	 * @constant
	 * @readonly
	 */
	urlReg = RegExp(/https?:\/\/\w+/, "i");

	/**
	 * The #evidence channel ID
	 *
	 * @type {string}
	 */
	evidenceChannelId = '486590751032082462';

	/**
	 * The #mod channel ID
	 *
	 * @type {string}
	 */
	modChannelId = '242405592998608896';

	/**
	 * The bitmask for `spamCheck`
	 *
	 * @constant
	 * @readonly
	 */
	spamCheckMask = Object.freeze({
		STAFF: 0,
		EVERYONE_PING: 1 << 0,
		URL: 1 << 1,
		SPAM_DOMAIN: 1 << 2,
		// future usage
		// SLUR: 1 << 3
	});

	/**
	 * Creates an instance of AntiSpamModule.
	 *
	 * @constructor
	 * @param {import('discord.js').Client} client
	 */
	constructor (client) {
		super(
			client,
			"Anti Spam",
			"we're vegetarians"
		);
	}


	/**
	 * Only match *some* of the words in the text
	 *
	 * @param {string} text The text to search in
	 * @param {string[]} searchWords The words to search in `text`
	 * @returns {boolean}
	 */
	multiSearchOr(text, searchWords) {
		return searchWords.some((el) => {
			return text.match(new RegExp(el, 'i'));
		});
	}

	/**
	 * Only match *all* of the words in the text
	 *
	 * @param {string} text The text to search in
	 * @param {string[]} searchWords The words to search in `text`
	 * @returns {boolean}
	 */
	multiSearchAnd(text, searchWords) {
		return searchWords.every((el) => {
			return text.match(new RegExp(el, 'i'));
		});
	}

	/**
	 * Performs a spam check based on a number of factors and input
	 *
	 * @param {Message} message The message to check
	 * @returns A number based off of `AntiSpamModule.spamCheckMask`'s members
	 */
	spamCheck(message) {
		if (!message.member) return;

		// Exit on staff
		if (message.member.permissions.has(PermissionFlagsBits.KickMembers)) return this.spamCheckMask.STAFF;

		// @everyone and URL check
		if (message.mentions.everyone && this.urlReg.test(`${message.content}`)) return (this.spamCheckMask.EVERYONE_PING & this.spamCheckMask.URL);

		// Bad domain JSON array check
		if (badURLs.some((filter) => message.content.toLowerCase().includes(filter.toLowerCase()))) return (this.spamCheckMask.SPAM_DOMAIN);

		// Old hardcoded check
		if (
			this.urlReg.test(`${message.content}`) && (
				this.multiSearchOr(message.content.toLowerCase(), ['disccrd', 'discond', 'discordcd', 'discorde', 'dlsccord', 'disorde', 'discrod'])
				|| this.multiSearchAnd(message.content.toLowerCase(), ['nitro', 'discord', 'steam'])
				|| this.multiSearchAnd(message.content.toLowerCase(), ['nitro', 'discord', 'gift'])
				|| this.multiSearchAnd(message.content.toLowerCase(), ['nitro', 'discord', 'month'])
				|| this.multiSearchAnd(message.content.toLowerCase(), ['nitro', 'discord', 'free'])
			)
		) {
			return this.spamCheckMask.SPAM_DOMAIN;
		}

		// if all fails, just explicitly return. shuts up typescript
		return;
	}

	init() {
		this.client.on(Events.MessageCreate, async (message) => {
			const evidenceChannel = message.guild?.channels.cache.get(this.evidenceChannelId);
			const modChannel = message.guild?.channels.cache.get(this.modChannelId);

			const spamType = this.spamCheck(message);
			if (spamType) {
				message.delete();

				// timeout for 1 day
				try {
					if (!message.member) { console.warn("Member cannot be found from message, is it possible that they've exited?"); return; };

					// make sure not to mute the dev
					if (message.member.id !== config.ownerId) await message.member.timeout(86400);
				} catch (error) {
					console.error("Attempted to mute member and failed", error);
				}

				// snitch to #evidence
				const evidenceEmbed = new EmbedBuilder()
					.setColor(this.colors.GRAY)
					.setAuthor({
						name: `Spam Logged (#${('name' in message.channel) ? message.channel.name : 'Unknown channel name'})`,
						iconURL: (message.guild) ? message.guild.iconURL({ size: 64 }) ?? '' : ''
					})
					.setTimestamp(new Date())
					.setFooter({
						text: `Member: ${message.author.id}`
					})
					.setDescription(`**Offender:** ${message.author.tag} ${message.author}
													**Type:** ${spamType}
													**Message:**
													${blockQuote(message.cleanContent)}`);

				if (evidenceChannel?.isSendable()) await evidenceChannel.send({ embeds: [evidenceEmbed] });

				// snitch to #mod
				const modEmbed = new EmbedBuilder()
					.setColor(this.colors.RED)
					.setDescription(`${message.author} (${message.author.tag}) triggered spam function (${spamType}).`);

				if (modChannel?.isSendable()) await modChannel.send({ embeds: [modEmbed] });
			}
		});
	}
}
