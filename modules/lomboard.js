const { EmbedBuilder, Events } = require('discord.js');
const { green } = require('../config.json');
const reactionsNeeded = 10;
const emojiId = '1194451869829967952';
// lmms server: <:bouba:1194451869829967952>
// dev server: <:bouba:1074102259190866010>


module.exports = {

	name: 'Lomboard',
	description: 'Starboard, Lommus Edition',
	listeners: ['messageReactionAdd', 'messageReactionRemove'],

	async execute(client) {
		client.on(Events.MessageReactionAdd, async (reaction, user) => {
			if (reaction.partial) await reaction.fetch();
			const message = reaction.message;

			if (reaction.emoji.id !== emojiId) return;
			if (message.channel.name === 'news') return;
			if (user.id === message.author.id) {
				message.reactions.cache.get(emojiId).remove()
					.catch(error => console.error('Failed to remove reaction:', error));
			}
			if (message.reactions.cache.get(emojiId).count < reactionsNeeded) return;

			const lomboard = message.guild.channels.cache.find(channel => channel.name === 'lomboard');
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
					.setTitle(`${client.emojis.cache.get(emojiId)} ${message.reactions.cache.get(emojiId).count}  •  #${message.channel.name}${messageAttach}`)
				//	.setFooter(foundStar.footer);
				const starMessage = await lomboard.messages.fetch(stars.id);
				await starMessage.edit({ embeds: [embed], files: [...message.attachments.values()] });
			}
			if (!stars) {
				const embed = new EmbedBuilder()
					.setColor(green)
					.setTimestamp(message.createdTimestamp)
					.setDescription(`${message.author}${messageContent}
														\n[jump to message](${message.url})`)
					.setTitle(`${client.emojis.cache.get(emojiId)} ${reactionsNeeded}  •  #${message.channel.name}${messageAttach}`)
					.setFooter({ text: `${message.id}` });
				await lomboard.send({ embeds: [embed], files: [...message.attachments.values()] });
			}
		});
	},
};
