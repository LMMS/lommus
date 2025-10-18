import { EmbedBuilder, Events } from 'discord.js';
import config from '../config.json' with { type: 'json' };
import { BotModule } from './module.mjs';

export default class AnnoyanceModule extends BotModule {
	/**
	 * Cache color configuration here + TS assertions
	 * @constant
	 */
	colors = {
		RED: /** @type {`#${string}`} */ (config.red),
		GREEN: /** @type {`#${string}`} */ (config.green)
	};
	constructor () {
		super('Annoyance', 'sus module sus module', ['messageCreate']);
	}
	/** @param {import('discord.js').Client} client */
	init(client) {
		// meme messages
		client.on(Events.MessageCreate, async (message) => {
			if (message.author.bot) return;
			if ('name' in message.channel && message.channel.name === 'resources') return;

			if (message.content.includes('!nightly')) {
				const embed = new EmbedBuilder()
					.setColor(this.colors.GREEN)
					.setDescription('Nightly versions are now available directly on the main LMMS download page! \n[Go to download page.](https://lmms.io/download) \n\nTreat nightly builds with utmost care. Back up any projects before loading and saving them in new versions.');
				return message.reply({ embeds: [embed] });
			}

			if (message.content.includes('?rank') || message.content.includes('?role')) {
				const embed = new EmbedBuilder()
					.setColor(this.colors.RED)
					.setDescription('Use `/color`.');
				return message.reply({ embeds: [embed] });
			}

			if (message.content.includes('amogus')) return message.react('923308755460952074');

			if (message.content === 'ඞ') {
				const rand = ['An Impostor', 'not The Impostor', 'ejected'];
				const chance = rand[Math.floor(Math.random() * rand.length)];

				return message.channel.send('.      　。　　　　•　    　ﾟ　　。      .\n　　.　　　.　　 　　.　　　　　。　　   。　.\n'
					+ ' 　.　　      。　        ඞ   。　    .    •\n    .      '
					+ `${message.author.username} was ${chance}   。  .\n`
					+ '　 　　。　　　　　　ﾟ　　　.　　　　　.\n,　　　　.　 .　　       .');
			}
		});
	}
}
