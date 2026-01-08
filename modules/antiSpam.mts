import { blockQuote, Client, EmbedBuilder, Events, Message, PermissionFlagsBits,type ColorResolvable } from 'discord.js';
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
	urlReg = /https?:\/\/\S+/i;

	/**
	 * The #evidence channel ID
	 */
	evidenceChannelId: string = '486590751032082462';

	/**
	 * The #mod channel ID
	 */
	modChannelId: string = '242405592998608896';

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
	 */
	constructor(client: Client) {
		super(
			client,
			"Anti Spam",
			"we're vegetarians"
		);
	}


	/**
	 * Only match *some* of the words in the text
	 *
	 * @param text The text to search in
	 * @param searchWords The words to search in `text`
	 */
	multiSearchOr(text: string, searchWords: string[]): boolean {
		return searchWords.some((el) =>
			String(text)
				.toLowerCase()
				.includes(String(el).toLowerCase())
		);
	}

	/**
	 * Only match *all* of the words in the text
	 *
	 * @param text The text to search in
	 * @param searchWords The words to search in `text`
	 */
	multiSearchAnd(text: string, searchWords: string[]): boolean {
		return searchWords.every((el) =>
			String(text)
				.toLowerCase()
				.includes(String(el).toLowerCase())
		);
	}

	/**
	 * Performs a spam check based on a number of factors and input
	 *
	 * @param message The message to check
	 * @returns A number based off of `AntiSpamModule.spamCheckMask`'s members
	 */
	spamCheck(message: Message): number | void {
		if (!message.member) return;
		if (message.author?.bot) return;

		// Exit on staff
		if (message.member.permissions.has(PermissionFlagsBits.KickMembers)) return;

		// @everyone and URL check
		if (message.mentions.everyone && this.urlReg.test(message.content)) return (this.spamCheckMask.EVERYONE_PING | this.spamCheckMask.URL);

		// Bad domain JSON array check
		if (
			badURLs.some((filter) =>
				message.content
					.toLowerCase()
					.includes(String(filter).toLowerCase()))
		) return this.spamCheckMask.SPAM_DOMAIN;

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
				try {
					await message.delete();
				} catch (error) {
					console.error("Failed to delete message", error);
				}

				// timeout for 1 day
				try {
					if (!message.member) { console.warn("Member cannot be found from message, is it possible that they've exited?"); return; };

					// make sure not to mute the dev
					if (message.member.id !== config.ownerId) await message.member.timeout(86_400_000);
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
					.setFields([
						{ name: 'Offender', value: `${message.author.tag} ${message.author}`, inline: true },
						{ name: 'Type', value: String(spamType), inline: true },
						{ name: 'Message', value: blockQuote(message.cleanContent) }
					]);

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
