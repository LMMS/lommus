const { EmbedBuilder, Events, ChannelType, ActionRowBuilder, ButtonStyle, ButtonBuilder, PermissionFlagsBits } = require('discord.js');
const { green, red } = require('../config.json');
const fs = require('fs');

module.exports = {

	name: 'Role Selector',
	description: 'Handles #info embed, embed buttons, and breakout commands.',
	listeners: ['interactionCreate, messageCreate'],

	async execute(client) {
		// Convenient integer to UTF emoji converter function
		function numberToEmoji(string) {
			return string
				.replace(/0/g, '0️⃣')
				.replace(/1/g, '1️⃣')
				.replace(/2/g, '2️⃣')
				.replace(/3/g, '3️⃣')
				.replace(/4/g, '4️⃣')
				.replace(/5/g, '5️⃣')
				.replace(/6/g, '6️⃣')
				.replace(/7/g, '7️⃣')
				.replace(/8/g, '8️⃣')
				.replace(/9/g, '9️⃣');
		}

		// get rest of embed content from JSON file
		const rulelist = await JSON.parse(fs.readFileSync('./data/rules.json', { 'encoding': 'utf-8' }));

		// When client fires interactionCreate (redundant across all modules)
		client.on(Events.InteractionCreate, async (interaction) => {
			// manual stealth command for making info embed
			if (interaction.isChatInputCommand() && interaction.commandName === 'infoembed') {
				if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
					const embed = new EmbedBuilder().setColor(red).setDescription('No.');
					return interaction.reply({ embeds: [embed], ephemeral: true });
				}
				// read text file for info embed contents
				const infoBody = await fs.readFileSync('./data/infoEmbed.txt', { 'encoding': 'utf-8' });
				const embed = new EmbedBuilder()
					.setTitle('Welcome!')
					.setThumbnail(interaction.guild.iconURL({ size: 128, dynamic: true }))
					.setColor(green)
					.setDescription(infoBody);

				const rules = new ButtonBuilder()
					.setCustomId('rules')
					.setLabel('Rules')
					.setStyle(ButtonStyle.Danger);

				const channels = new ButtonBuilder()
					.setCustomId('channels')
					.setLabel('Channels')
					.setStyle(ButtonStyle.Primary);

				// MUST HAVE ROLESELECTION.JS FOR THIS BUTTON TO FUNCTION
				const roles = new ButtonBuilder()
					.setCustomId('roles')
					.setLabel('Roles')
					.setStyle(ButtonStyle.Success);

				const download = new ButtonBuilder()
					.setURL('https://lmms.io/download')
					.setLabel('Get LMMS')
					.setStyle(ButtonStyle.Link);

				const github = new ButtonBuilder()
					.setURL('https://github.com/lmms')
					.setLabel('GitHub')
					.setStyle(ButtonStyle.Link);

				const row = new ActionRowBuilder()
					.addComponents(rules, channels, roles, download, github);

				interaction.deferReply();
				interaction.deleteReply();
				await interaction.channel.send({ embeds: [embed], components: [row] });
			}
			if (interaction.isChatInputCommand() && interaction.commandName === 'editrule') {
				if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
					const embed = new EmbedBuilder().setColor(red).setDescription('No.');
					return interaction.reply({ embeds: [embed], ephemeral: true });
				}
				// get command args
				const editNumber = interaction.options.getInteger('number');
				const editType = interaction.options.getString('target');
				const editContent = interaction.options.getString('input');

				// prebuild embed
				const embed = new EmbedBuilder()
					.setColor(red)
					.setDescription('Something went wrong.');

				// if rule exists, edit it
				if (editNumber <= Object.keys(rulelist).length && editNumber > 0) {
					// edit rule title
					if (editType === 'ruleEditTitle') {
						embed.setDescription(`Rule ${editNumber} title changed. \n\n**Old title:** \n${rulelist[editNumber].title} \n\n**New title:**\n${editContent}`);
						rulelist[editNumber].title = editContent;
					}
					// edit rule body
					if (editType === 'ruleEditBody') {
						embed.setDescription(`Rule ${editNumber} body changed. \n\n**Old title:** \n${rulelist[editNumber].body} \n\n**New title:**\n${editContent}`);
						rulelist[editNumber].body = editContent;
					}
					// change embed color
					embed.setColor(green);
					// write resulting file for persistence
					fs.writeFileSync('./data/rules.json', JSON.stringify(rulelist));
				}

				// send embed as interaction reply
				return await interaction.reply({ embeds: [embed], ephemeral: true });
			}

			// Rule # conditional
			if (interaction.isChatInputCommand() && interaction.commandName === 'rule') {
				const number = interaction.options.getInteger('number');
				// prebuild embed
				const embed = new EmbedBuilder()
					.setColor(red)
					.setDescription('Enter a valid rule number.');
				if (number <= Object.keys(rulelist).length && number > 0) {
					embed.setColor(green);
					embed.setDescription(numberToEmoji(`${number} **${rulelist[number].title}**\n${rulelist[number].body}`));
					return await interaction.reply({ embeds: [embed], ephemeral: false });
				}
				// send embed as interaction reply
				return await interaction.reply({ embeds: [embed], ephemeral: true });
			}
			// Rule List conditional: either a button or a command. screen both
			if (interaction.isButton() && interaction.customId === 'rules' || interaction.isCommand() && interaction.commandName === 'rulelist') {
				// init and set first line of embed content
				let rulesList = 'Please follow these rules if you want to stay on this server.\n';
				// loop rules JSON object's toplevel keys
				for (const key in rulelist) {
					// push each key's sub key and sub value to the embed content variable
					rulesList += `\n${key} **${rulelist[key].title}**\n  ${rulelist[key].body}\n`;
				}

				// push final addendum to output variable
				rulesList += '\n*Additionally, follow the terms of the Discord ToS. Severe enough infractions go straight to ban.*';

				// embed character limit sanity check
				if (rulesList.length > 4096) rulesList = 'Character limit exceeded.';
				// build embed. send embed description through number to emoji function
				const embed = new EmbedBuilder()
					.setColor(green)
					.setTimestamp()
					.setTitle('Server Rules')
					.setDescription(numberToEmoji(rulesList));
				// send embed as interaction reply
				return await interaction.reply({ embeds: [embed], ephemeral: true });
			}

			// Channel list conditional: either a button or a command. screen both
			if (interaction.isButton() && interaction.customId === 'channels' || interaction.isChatInputCommand() && interaction.commandName === 'channels') {
				// get a list of categories on the server, filter by @everyone read permissions and type and sort them top to bottom
				const categoryList = interaction.guild.channels.cache
					.filter(c => c.type === ChannelType.GuildCategory && interaction.guild.roles.cache.get(interaction.guild.id).permissionsIn(c).has(PermissionFlagsBits.ViewChannel))
					.sort((a, b) => a.rawPosition - b.rawPosition)
					.map(c => c);
				// init and prefill output variable
				let channels = 'Please follow these channel topic guidelines. <:spoopy:243848405850259456>';
				// loop categories
				for (const category of categoryList) {
					if (category.name === 'VOICE' || category.name === 'ARCHIVE') continue;
					// for each category, push the category name
					channels += `\n\n**${category.name}:**`;
					// the loop children of category, filtered by everyone permissions and type, sorted top to bottom
					const children = category.children.cache
						.filter(c => interaction.guild.roles.cache.get(interaction.guild.id).permissionsIn(c).has(PermissionFlagsBits.ViewChannel))
						.filter(c => c.type === ChannelType.GuildText || c.type === ChannelType.GuildNews || c.type === ChannelType.GuildForum)
						.sort((a, b) => a.rawPosition - b.rawPosition)
						.map(c => c);
					// loop the children
					for (const channel of children) {
						// catch empty topics
						let topic = 'No topic set.';
						// actually catch empty topics
						if (channel.topic) topic = channel.topic;
						// push channel and topic to output variable
						channels += `\n${channel} - ${topic}`;
					}
				}
				// push final addendum to output variable
				channels += '\n\n*The TECH categories have strict topics and offtopic chat will not be tolerated.'
									+ ' Additionally, in those channels it\'s best to follow the https://dontasktoask.com/ and https://nohello.net/ guidelines.*';

				// embed character limit sanity check
				if (channels.length > 4096) channels = 'Character limit exceeded.';
				// build embed. send embed description through number to emoji function
				const embed = new EmbedBuilder()
					.setColor(green)
					.setTimestamp()
					.setTitle('Channel Directory')
					.setDescription(channels);
				// send embed as interaction reply
				return await interaction.reply({ embeds: [embed], ephemeral: true });
			}
		});
	},
};
