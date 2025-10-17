const { EmbedBuilder, Events } = require('discord.js');
const { green, red } = require('../config.json');

module.exports = {

	name: 'Annoyance',
	description: 'sus module sus module',
	listeners: ['messageCreate'],

	async execute(client) {

		// meme messages
		client.on(Events.MessageCreate, async message => {
			if (message.author.bot) return;
			if (message.channel.name === 'resources') return;

			if (message.content.includes('!nightly')) {
				const embed = new EmbedBuilder()
					.setColor(green)
					.setDescription('Nightly versions are now available directly on the main LMMS download page! \n[Go to download page.](https://lmms.io/download) \n\nTreat nightly builds with utmost care. Back up any projects before loading and saving them in new versions.');
				return message.reply({ embeds: [embed] });
			}

			if (message.content.includes('?rank') || message.content.includes('?role')) {
				const embed = new EmbedBuilder()
					.setColor(red)
					.setDescription('Use `/color`.');
				return message.reply({ embeds: [embed] });
			}

			if (message.content.includes('amogus')) return message.react('923308755460952074');
			if (message.content === 'ඞ') {
				const rand = ['An Impostor', 'not The Impostor', 'ejected'];
				const chance = rand[Math.floor(Math.random() * rand.length)];

				message.channel.send('.      　。　　　　•　    　ﾟ　　。      .\n　　.　　　.　　 　　.　　　　　。　　   。　.\n'
															+ ' 　.　　      。　        ඞ   。　    .    •\n    .      '
															+ `${message.author.username} was ${chance}   。  .\n`
															+ '　 　　。　　　　　　ﾟ　　　.　　　　　.\n,　　　　.　 .　　       .');
			}
		});
	},
};
