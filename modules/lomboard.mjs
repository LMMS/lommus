import { EmbedBuilder, Events } from 'discord.js';
import { BotModule } from './util/module.mjs';
import { config } from './util/config.mjs';

export default class LomboardModule extends BotModule {
	/**
	 * The emoji ID used for starring messages
	 *
	 * @type {string}
	 */
	starEmojiId = '1194451869829967952';


	/**
	 * The star emoji
	 *
	 * @type {import('discord.js').GuildEmoji}
	 */
	starEmoji;

	/**
	 * The `#lomboard` channel ID
	 *
	 * @type {string}
	 */
	lomboardChannelId = '1074109666730197083';

	/**
	 * The `#lomboard` channel
	 *
	 * @type {import('discord.js').TextChannel}
	 */
	lomboardChannel;

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
			'Starboard, Lommus Edition'
		);
		let cachedStarEmoji = client.emojis.cache.get(this.starEmojiId);
		if (cachedStarEmoji) {
			this.starEmoji = cachedStarEmoji
		} else {
			throw new Error("Can't find star emoji!");
		};

		let cachedLomboardChannel = client.channels.cache.get(this.lomboardChannelId);
		if (cachedLomboardChannel) {
			// @ts-ignore
			this.lomboardChannel = cachedLomboardChannel
		} else {
			throw new Error("Can't find Lomboard channel!");
		}
	}

	init() {
		this.client.on(Events.MessageReactionAdd, async (reaction, user, _details) => {
			if (reaction.partial) await reaction.fetch();

			/** The message that received a reaction */
			const message = reaction.message;
			if (message.partial) await message.fetch();
			if (!message.guild || !message.channel.isTextBased()) return;

			// Don't scan stars in these channels
			if ([
				'242405592998608896',
				'434753275485618176',
				'242402504262811648',
				'486590751032082462',
				'283757917230858240'
			].includes(message.channelId)) return;

			// Remove selfishness
			if (message.author && message.author.id === user.id)
				reaction.users
					.remove(user.id)
					.catch(err => {
					console.error('Failed to remove reaction:', err)
				})

			/** The star reactions of the message (if any) */
			const messageStarReactions = message.reactions.cache.get(this.starEmojiId);
			if (!messageStarReactions) return;

			// check reaction count
			if (messageStarReactions.count < this.reactionsNeeded) return;

			/** All messages in Lomboard */
			const lomboardMessages = await this.lomboardChannel.messages.fetch({ limit: 100 });

			/** The existing boarded message, if exists */
			const existingBoardedMsg = lomboardMessages.find(msg => {
				return Boolean(msg.embeds[0]?.footer?.text?.startsWith(message.id));
			});

			let messageAttachment = '';
			let messageContent = '';

			if (message.attachments.size > 0) messageAttachment = ' •  File(s) Above';
			if (message.content && message.content.length > 0) messageContent = `\n${message.cleanContent}`;

			// is there an existing board message?
			if (existingBoardedMsg && existingBoardedMsg.embeds[0]) {
				const boardedMsgEmbed = existingBoardedMsg.embeds[0];

				const embed = EmbedBuilder.from(boardedMsgEmbed)
					.setColor(boardedMsgEmbed.color)
					.setDescription(boardedMsgEmbed.description)
					.setTitle(`${this.starEmoji} ${messageStarReactions.count} • #${message.channel.name}${messageAttachment}`)
					.setFooter(boardedMsgEmbed.footer);

				if (boardedMsgEmbed.timestamp) embed.setTimestamp(new Date(boardedMsgEmbed.timestamp));

				return await existingBoardedMsg.edit({ embeds: [embed], files: [...message.attachments.values()] });
			} else {
				const embed = new EmbedBuilder()
					.setColor(this.colors.GREEN)
					.setTimestamp(message.createdTimestamp)
					.setDescription(`${message.author}${messageContent}
														\n[jump to message](${message.url})`)
					.setTitle(`${this.starEmoji} ${messageStarReactions.count}  •  #${message.channel.name}${messageAttachment}`)
					.setFooter({ text: message.id });

					return await this.lomboardChannel.send({ embeds: [embed], files: [...message.attachments.values()] })
			}
		})
	}
}
