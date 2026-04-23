import { Client, Events, Message, PermissionFlagsBits, EmbedBuilder, blockQuote, TextChannel } from 'discord.js'
import { BotModule } from './util/module.mjs'
import badURLs from '../data/spam.json' with { type: 'json' }
import { config } from './util/config.mjs'

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
		NONE: 0,
		STAFF: 1 << 0,
		EVERYONE_PING: 1 << 1,
		URL: 1 << 2,
		SPAM_DOMAIN: 1 << 3,
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
		)
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
		)
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
		)
	}

	/**
	 * Performs a spam check based on a number of factors and input
	 *
	 * @param message The message to check
	 * @returns A number based off of `AntiSpamModule.spamCheckMask`'s members
	 */
	spamCheck(message: Message): number {
		if (!message.member) return this.spamCheckMask.NONE
		if (message.author?.bot) return this.spamCheckMask.NONE

		// If staff, return
		if (message.author.id === config.ownerId.toString()) return this.spamCheckMask.NONE
		if (message.member.permissions.has(PermissionFlagsBits.KickMembers)) return this.spamCheckMask.NONE

		// @everyone and URL check
		if (
			message.mentions.everyone
			&& this.urlReg.test(message.content)
		) return (this.spamCheckMask.EVERYONE_PING | this.spamCheckMask.URL)

		return this.spamCheckMask.NONE
	}

	init() {
		this.client.on(Events.MessageCreate, async (message) => {
			const evidenceChannel = this.client.channels.cache.get(this.evidenceChannelId) as TextChannel
			const modChannel = this.client.channels.cache.get(this.modChannelId) as TextChannel

			const spamCheckResult = this.spamCheck(message)

			if (spamCheckResult === this.spamCheckMask.NONE) return

			try {
				await message.delete()
			} catch (error) {
				console.error("Failed to delete message", error)
			}

			const evidenceEmbed = new EmbedBuilder()
				.setColor(this.colors.GRAY)
				.setAuthor({
					name: `Spam Logged (#${('name' in message.channel) ? message.channel.name : 'Unknown channel name'})`
				})
				.setTimestamp(new Date())
				.setFooter({
					text: `Member: ${message.author.id}`
				})
				.setFields([
					{ name: 'Offender', value: `${message.author.tag} ${message.author}`, inline: true },
					{ name: 'Type', value: String(spamCheckResult), inline: true },
					{ name: 'Message', value: blockQuote(message.cleanContent) }
				])

			await evidenceChannel.send({ embeds: [evidenceEmbed] })
		})
	}
}
