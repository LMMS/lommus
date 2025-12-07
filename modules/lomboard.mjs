import { EmbedBuilder, Events } from 'discord.js';
import { BotModule } from './util/module.mjs';
import { config } from './util/config.mjs';

// lmms server: <:bouba:1194451869829967952>

export default class LomboardModule extends BotModule {
	/**
	 * The emoji ID used for starring messages
	 *
	 * @type {string}
	 */
	emojiId = '1194451869829967952';

	/**
	 * The #lomboard channel
	 *
	 * @type {string}
	 */
	lomboardChannel = '1074109666730197083';

	/**
	 * Number of reactions needed to get to the Lomboard
	 *
	 * @type {number}
	 */
	reactionsNeeded = config.lomboardReactionLimit;

	/**
	 * Creates an instance of LomboardModule.
	 *
	 * @constructor
	 * @param {import('discord.js').Client} client
	 */
	constructor (client) {
		super(
			client,
			'Lomboard',
			'Starboard, Lommus Edition',
			['messageReactionAdd', 'messageReactionRemove']
		);
	}

	init() {
		this.client.on(Events.MessageReactionAdd, async (reaction, user) => {
			const lomboard = await this.client.guilds.cache.get(config.guildId)?.channels.fetch(this.lomboardChannel);
			if (!lomboard) return console.error("Lomboard not found!");

			if (!lomboard.isTextBased()) return console.error("Lomboard isn't a text based channel! (what)");

			if (reaction.partial) await reaction.fetch();

			const message = reaction.message;
			const emojiIdCache = message.reactions.cache.get(this.emojiId);

			if (!message.guild || !emojiIdCache) return;

			if (
				reaction.emoji.id !== this.emojiId
				|| !('name' in message.channel && message.channel.name === 'news')
			) return;

			if (message.author && user.id === message.author.id) {
				if (emojiIdCache) emojiIdCache.remove()
					.catch(error => console.error('Failed to remove reaction:', error));
			}

			if (emojiIdCache && emojiIdCache.count < this.reactionsNeeded) return;

			const fetch = await lomboard.messages.fetch({ limit: 100 });
			const stars = fetch.find(msg => {
				if (msg.embeds[0]?.footer) msg.embeds[0].footer.text.startsWith(message.id);
			});

			let messageAttach = '';
			let messageContent = '';

			if (message.attachments.size > 0) messageAttach = '  •  File(s) Above';
			if (message.content && message.content.length > 0) messageContent = `\n${message.cleanContent}`;

			if (stars) {
				const starMessage = await lomboard.messages.fetch(stars.id);
				const foundStar = stars.embeds[0];
				if (!foundStar) return;
				const embed = EmbedBuilder.from(foundStar)
					.setColor(foundStar.color)
					.setTimestamp(Number(foundStar.timestamp))
					.setDescription(foundStar.description)
					.setTitle(`${this.client.emojis.cache.get(this.emojiId)} ${emojiIdCache.count}  •  #${message.channel.name}${messageAttach}`)
					.setFooter(foundStar.footer);

				await starMessage.edit({ embeds: [embed], files: [...message.attachments.values()] });
			} else {
				const embed = new EmbedBuilder()
					.setColor(this.colors.GREEN)
					.setTimestamp(message.createdTimestamp)
					.setDescription(`${message.author}${messageContent}
														\n[jump to message](${message.url})`)
					.setTitle(`${this.client.emojis.cache.get(this.emojiId)} ${this.reactionsNeeded}  •  #${message.channel.name}${messageAttach}`)
					.setFooter({ text: `${message.id}` });

				await lomboard.send({ embeds: [embed], files: [...message.attachments.values()] });
			}
		});
	}
}
