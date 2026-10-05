import { blockQuote, Client, EmbedBuilder, Events, TextChannel } from "discord.js"
import { BotModule } from "./util/module.mts"
import { hash } from "node:crypto"

interface UserBufferData {
	lastChannelId: string
	lastTimestamp: number
	// lastHash: bigint
	lastHash: string
	hits: number
}

export default class extends BotModule {
	private readonly bufferCleanupIntervalMs = 2000 as const
	private readonly countAsSpamThresholdMs = 1000 as const
	private readonly hitThreshold = 3 as const

	/**
	 * The #evidence channel ID
	 */
	private readonly evidenceChannelId = '486590751032082462' as const;

	private userBuffer: Map<string, UserBufferData> = new Map()

	constructor(bot: Client) {
		super(
			bot,
			"Anti-spam 2",
			"we're vegans (lommus-v2 backport)"
		)

		this.cleanup()
	}

	init() {
		this.client.on(Events.MessageCreate, async (msg) => {
			const evidenceChannel = this.client.channels.cache.get(this.evidenceChannelId) as TextChannel

			if (msg.system || msg.author.bot || msg.author.id === this.client.user!.id) return

			const user = this.userBuffer.getOrInsert(msg.author.id, {
				lastChannelId: msg.channel.id,
				lastTimestamp: msg.createdTimestamp,
				// lastHash: Bun.hash.rapidhash(msg.content),
				lastHash: hash('sha-1', msg.content),
				hits: 0
			})


			if (
				(msg.createdTimestamp - user.lastTimestamp) < this.countAsSpamThresholdMs
				&& user.lastChannelId !== msg.channel.id
			) {
				this.userBuffer.set(msg.author.id, {
					lastChannelId: msg.channel.id,
					lastTimestamp: msg.createdTimestamp,
					// lastHash: Bun.hash.rapidhash(msg.content),
					lastHash: hash('sha-1', msg.content),
					hits: user.hits + 1
				})
			}

			if (user.hits >= this.hitThreshold) {
				const evidenceEmbed = new EmbedBuilder()
					.setColor(this.colors.GRAY)
					.setAuthor({
						name: `Spam Logged (#${('name' in msg.channel) ? msg.channel.name : 'Unknown channel name'})`
					})
					.setTimestamp(new Date())
					.setFooter({
						text: `Member: ${msg.author.id}`
					})
					.setFields([
						{ name: 'Offender', value: `${msg.author.tag} ${msg.author}`, inline: true },
						{ name: 'Message', value: blockQuote(msg.cleanContent) }
					])

				evidenceChannel.send({ embeds: [ evidenceEmbed ] })
				this.action(msg.author.id)
			}
		})
	}

	private cleanup() {
		return setInterval(() => {
			for (const [ id, userData ] of this.userBuffer) {
				if (
					(Date.now() - userData.lastTimestamp)
					> this.countAsSpamThresholdMs
				)
					this.userBuffer.delete(id)
			}
		}, this.bufferCleanupIntervalMs)
	}

	private action(userId: string) {
		this.userBuffer.delete(userId)
		return console.warn(`${userId} triggered anti-spam.`)
	}
}
