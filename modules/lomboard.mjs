import { EmbedBuilder, Events } from 'discord.js';
import { BotModule } from './util/module.mjs';

// lmms server: <:bouba:1194451869829967952>
// dev server: <:bouba:1074102259190866010>

export default class LomboardModule extends BotModule {
	/**
	 * The emoji ID used for starring messages
	 *
	 * @type {string}
	 */
	emojiId = '1194451869829967952';

	/**
	 * Number of reactions needed to get to the Lomboard
	 *
	 * @type {number}
	 */
	reactionsNeeded = 10;

	constructor () {
		super('Lomboard', 'Starboard, Lommus Edition', ['messageReactionAdd', 'messageReactionRemove']);
	}
	/** @param {import('discord.js').Client} client */
	init(client) {
		client.on(Events.MessageReactionAdd, async (reaction, user) => {
			if (reaction.partial) await reaction.fetch();
			const message = reaction.message;
			const emojiIdCache = message.reactions.cache.get(this.emojiId);
			if (!message.guild) return;
			const lomboard = message.guild.channels.cache.find(channel => channel.name === 'lomboard');

			if (
				reaction.emoji.id !== this.emojiId
				&& ('name' in message.channel && message.channel.name === 'news')
			) return;

			if (message.author && user.id === message.author.id) {
				if (emojiIdCache) emojiIdCache.remove()
					.catch(error => console.error('Failed to remove reaction:', error));
			}

			if (emojiIdCache && emojiIdCache.count < this.reactionsNeeded) return;

			if (!lomboard) return console.error('Lomboard reaction detected but no lomboard channel found!');

			const fetch = await lomboard.messages.fetch({ limit: 100 });
			const stars = fetch.find(m => m.embeds[0].footer.text.startsWith(message.id));
			let messageAttach = '';
			let messageContent = '';
			if (message.attachments.size > 0) messageAttach = '  •  File(s) Above';
			if (message.content.length > 0) messageContent = `\n${message.cleanContent}`;

			if (stars) {
				const foundStar = stars.embeds[0];
				const embed = EmbedBuilder.from(foundStar)
					//.setColor(foundStar.color)
					//.setTimestamp(foundStar.timestamp)
					//	.setDescription(foundStar.description)
					.setTitle(`${client.emojis.cache.get(this.emojiId)} ${emojiIdCache.count}  •  #${message.channel.name}${messageAttach}`);
				//	.setFooter(foundStar.footer);
				const starMessage = await lomboard.messages.fetch(stars.id);
				await starMessage.edit({ embeds: [embed], files: [...message.attachments.values()] });
			}
			if (!stars) {
				const embed = new EmbedBuilder()
					.setColor(this.colors.GREEN)
					.setTimestamp(message.createdTimestamp)
					.setDescription(`${message.author}${messageContent}
														\n[jump to message](${message.url})`)
					.setTitle(`${client.emojis.cache.get(this.emojiId)} ${this.reactionsNeeded}  •  #${message.channel.name}${messageAttach}`)
					.setFooter({ text: `${message.id}` });
				await lomboard.send({ embeds: [embed], files: [...message.attachments.values()] });
			}
		});
	}
}
