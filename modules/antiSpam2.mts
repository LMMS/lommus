import { blockQuote, Client, EmbedBuilder, Events, Message, TextChannel, type OmitPartialGroupDMChannel } from "discord.js"
import { BotModule } from "./util/module.mts"
// import { hash } from "node:crypto"

interface UserBufferData {
	lastChannelId: string
	lastTimestamp: number
	messages: Set<OmitPartialGroupDMChannel<Message<boolean>>>
	hits: number
}

export default class extends BotModule {
	private readonly bufferCleanupIntervalMs = 2000 as const
	private readonly countAsSpamThresholdMs = 2000 as const
	private readonly hitThreshold = 3 as const
	private readonly cleanupInterval: NodeJS.Timeout

	/**
	 * The #evidence channel ID
	 */
	private readonly evidenceChannelId = '486590751032082462' as const;

	private buffer: Record<string, UserBufferData> = {}

	constructor(bot: Client) {
		super(
			bot,
			"Anti-spam 2",
			"we're vegans (lommus-v2 backport)"
		)

		this.cleanupInterval = this.cleanup()
	}

	init() {
		this.client.on(Events.MessageCreate, async (msg) => {
			const evidenceChannel = this.client.channels.cache.get(this.evidenceChannelId) as TextChannel

			if (msg.system || msg.author.bot || msg.author.id === this.client.user!.id) return

			const user = this.buffer[msg.author.id] ?? {
				lastChannelId: msg.channel.id,
				lastTimestamp: msg.createdTimestamp,
				messages: new Set([ msg ]),
				hits: 0
			}
			this.buffer[msg.author.id] = user

			if (
				(msg.createdTimestamp - user.lastTimestamp) < this.countAsSpamThresholdMs
				&& user.lastChannelId !== msg.channel.id
			) {
				this.buffer[ msg.author.id ]!.lastChannelId = msg.channel.id
				this.buffer[ msg.author.id ]!.lastTimestamp = msg.createdTimestamp
				this.buffer[ msg.author.id ]!.hits++
				this.buffer[ msg.author.id ]!.messages.add(msg)
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
			for (const [ id, userData ] of Object.entries(this.buffer)) {
				if ((Date.now() - userData.lastTimestamp) > this.countAsSpamThresholdMs) delete this.buffer[ id ]
			}
		}, this.bufferCleanupIntervalMs)
	}

	private action(userId: string) {
		const buf = this.buffer[ userId ]

		if (!buf) {
			console.error(`Cannot find user ID ${userId} in user buffer`)
			return
		}

		buf.messages.values().next().value?.member?.kick("Automatic anti-spam protection. Rejoin when you've recovered your account.")

		for (const message of buf.messages) {
			message.delete()
		}

		delete this.buffer[ userId ]
		return console.warn(`${userId} triggered anti-spam.`)
	}
}
