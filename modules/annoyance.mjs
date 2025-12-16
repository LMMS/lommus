import { EmbedBuilder, Events } from 'discord.js';
import { BotModule } from './util/module.mjs';

export default class AnnoyanceModule extends BotModule {
	lomsusEmojiId = '1194456812955652117'

	/**
	 * Creates an instance of AnnoyanceModule.
	 *
	 * @constructor
	 * @param {import('discord.js').Client} client
	 */
	constructor (client) {
		super(
			client,
			'Annoyance',
			'sus module sus module'
		);
	}

	init() {
		// meme messages
		this.client.on(Events.MessageCreate, async (message) => {
			if (
				message.author.bot
				|| ('name' in message.channel && message.channel.name === 'resources')
			) return;

			if (message.content.startsWith('!nightly')) {
				const embed = new EmbedBuilder()
					.setColor(this.colors.RED)
					.setDescription('This chat command is deprecated, use `/nightly`');
				return message.reply({ embeds: [embed] });
			}

			if (message.content.includes('?rank') || message.content.includes('?role')) {
				const embed = new EmbedBuilder()
					.setColor(this.colors.RED)
					.setDescription('Use `/color`.');
				return message.reply({ embeds: [embed] });
			}

			if (message.content.includes('amogus')) return message.react(this.lomsusEmojiId);

			if (message.content.includes('ඞ') || message.content.includes('ඩ')) {
				const rand = ['An Impostor', 'not The Impostor', 'ejected'];
				const chance = rand[Math.floor(Math.random() * rand.length)];

				return message.channel.send('.      　。　　　　•　    　ﾟ　　。      .\n　　.　　　.　　 　　.　　　　　。　　   。　.\n'
					+ ' 　.　　      。　        ඞ   。　    .    •\n    .      '
					+ `${message.author.username} was ${chance}   。  .\n`
					+ '　 　　。　　　　　　ﾟ　　　.　　　　　.\n,　　　　.　 .　　       .');
			}

			return;
		});
	}
}
