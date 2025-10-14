// const { blockQuote } = require('@discordjs/builders');
const { EmbedBuilder, Events, PermissionFlagsBits } = require('discord.js');
const { red } = require('../config.json');
// const badURLs = require('../spam.json');
const wait = require('node:timers/promises').setTimeout;
const urlReg = /https?:\/\/\w+/;

module.exports = {

	name: 'Watchdog',
	description: 'oh no you didn\'t.',
	listeners: ['messageCreate'],

	async execute(client) {

		/*	// Search Functions
		const multiSearchOr = (text, searchWords) => (
			searchWords.some((el) => {
				return text.match(new RegExp(el, 'i'));
			})
		);
		const multiSearchAnd = (text, searchWords) => (
			searchWords.every((el) => {
				return text.match(new RegExp(el, 'i'));
			})
		);

		// Curerntly, nitro/steam scam checks only
		function spamCheck(message) {
			// Exit on staff
			// if (message.member.permissions.has(Permissions.FLAGS.KICK_MEMBERS)) return false;

			// @everyone and URL check
			if (message.mentions.everyone && urlReg.test(`${message.content}`)) return 'EVERYONE & URL';

			// Bad domain JSON array check
			if (badURLs.some((filter) => message.content.toLowerCase().includes(filter.toLowerCase()))) return 'BAD LINK FILTER';

			// Old hardcoded check
			if (urlReg.test(`${message.content}`)) {
				if (multiSearchOr(message.content.toLowerCase(), ['disccrd', 'discond', 'discordcd', 'discorde', 'dlsccord', 'disorde', 'discrod']) ||
						multiSearchAnd(message.content.toLowerCase(), ['nitro', 'discord', 'steam']) ||
						multiSearchAnd(message.content.toLowerCase(), ['nitro', 'discord', 'gift']) ||
						multiSearchAnd(message.content.toLowerCase(), ['nitro', 'discord', 'month']) ||
						multiSearchAnd(message.content.toLowerCase(), ['nitro', 'discord', 'free'])) {
					return 'OLD FILTER';
				}
			}
		} */

		/* ============================

				Message Create

		=============================*/
		client.on(Events.MessageCreate, async message => {
			if (message.author.bot) return;

			/* // Spam filtering
			const spamType = spamCheck(message);
			if (spamType) {
				message.delete();

				// silence the fool
				try { await message.member.timeout(3600000, `User triggered automatic spam filtering. (${spamType})`); }
				catch (error) { console.error('Attemped to mute spammer and failed.', error); }


				// tell mods about it in detail
				const evidenceEmbed = new MessageEmbed()
					.setColor(gray)
					.setAuthor(`Spam Logged (#${message.channel.name})`, message.guild.iconURL({ size: 64, dynamic: true }))
					.setTimestamp()
					.setFooter(`Member: ${message.author.id}`)
					.setDescription(`**Offender:** ${message.author.tag} ${message.author}
													**Type:** ${spamType}
													**Message:**
													${blockQuote(message.cleanContent)}`);
				await message.guild.channels.cache.find(channel => channel.name === 'evidence')
					.send({ embeds: [evidenceEmbed] });

				// tell mods about it in less detail
				const modEmbed = new MessageEmbed()
					.setColor(red)
					.setDescription(`${message.author} (${message.author.tag}) triggered spam function (${spamType}).`);
				await message.guild.channels.cache.find(channel => channel.name === 'mod')
					.send({ embeds: [modEmbed] });
			} */

			// resouces image/link handler
			if (message.channel.name === 'resources') {
				// is it a staff? does it have no url and attachments?
				if (message.member.permissions.has(PermissionFlagsBits.BanMembers) || !urlReg.test(message.content) && message.attachments.size > 0) {
					message.react('✅');
				}
				else {
					message.delete();
					const embed = new EmbedBuilder()
						.setColor(red)
						.setDescription('This channel is for sharing presets, samples, and LMMS themes you have the legal rights to share. This is not a discussion or request channel. Please do not share binaries or links to external resources.');

					message.channel.send({ embeds: [embed] })
						.then(async sentMessage => {
							await wait(10000);
							sentMessage.delete();
						});
				}
			}

		});
	},
};
