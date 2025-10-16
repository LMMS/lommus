/*
		script to generate the client side slash commands
		kev 2021
*/
require('dotenv').config();
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, guildId, token } = require('./config.json');

// Manual command builder for now
const commands = [
	// restart
	new SlashCommandBuilder()
		.setName('restart')
		.setDescription('Bippidy Boppidy Ska')
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

	// say
	new SlashCommandBuilder()
		.setName('say')
		.setDescription('say something as the bot')
		.addStringOption(option => option.setName('message')
			.setDescription('what LoMMuS should say')
			.setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	// info embed
	new SlashCommandBuilder()
		.setName('infoembed')
		.setDescription('generate the LMMS server info embed')
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

	// rule
	new SlashCommandBuilder()
		.setName('rule')
		.setDescription('display a rule in the chat')
		.addIntegerOption(option =>
			option.setName('number')
				.setDescription('number of rule')
				.setRequired(true)),

	// rulelist
	new SlashCommandBuilder()
		.setName('rulelist')
		.setDescription('get a private copy of the rules'),

	// edit
	new SlashCommandBuilder()
		.setName('editrule')
		.setDescription('edit rules')
		.addIntegerOption(option =>
			option.setName('number')
				.setDescription('rule number to edit')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('target')
				.setDescription('select target to edit')
				.setRequired(true)
				.addChoices(
					{ name: 'rule title', value: 'ruleEditTitle' },
					{ name: 'rule body', value: 'ruleEditBody' },
				))
		.addStringOption(option =>
			option.setName('input')
				.setDescription('what you would like the target to say')
				.setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

	// channels
	new SlashCommandBuilder()
		.setName('channels')
		.setDescription('get a list of server channels'),

	// color
	new SlashCommandBuilder()
		.setName('color')
		.setDescription('gently apply color to self'),

	// toggle
	new SlashCommandBuilder()
		.setName('toggle')
		.setDescription('( ͡°( ͡° ͜ʖ( ͡° ͜ʖ ͡°)ʖ ͡°) ͡°)')
		.addStringOption(option =>
			option.setName('function')
				.setDescription('functionality to toggle')
				.setRequired(true)
				.addChoices(
					{ name: 'color', value: 'toggle_color' },
				))
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	// report
	new SlashCommandBuilder()
		.setName('report')
		.setDescription('report sus behavior')
		.addUserOption(option => option.setName('user')
			.setDescription('user being reported (mention or ID)')
			.setRequired(true))
		.addStringOption(option => option.setName('message')
			.setDescription('message link (must be URL!)')
			.setRequired(true))
		.addStringOption(option => option.setName('details')
			.setDescription('explain problem (briefly)')
			.setRequired(true)),

	// whois
	new SlashCommandBuilder()
		.setName('whois')
		.setDescription('get info about a user')
		.addUserOption(option =>
			option.setName('user')
				.setDescription('user mention or ID')
				.setRequired(true)),

	// server
	new	SlashCommandBuilder()
		.setName('server')
		.setDescription('get info about the server'),

	// bot
	new	SlashCommandBuilder()
		.setName('bot')
		.setDescription('get info about this bot'),

	// topic
	new	SlashCommandBuilder()
		.setName('topic')
		.setDescription('briefly display topic of channel'),
]

	.map(command => command.toJSON());


/* Discord JS command handler is a bunch of bullshit
const fs = require('fs');
const commandFiles = fs.readdirSync('./modules').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./modules/${file}`);
	if (command.data) {
		const data = Object.values(command.data);
		console.log(data);
		commands.push(data.toJSON());
	}
}
*/

/* // Jank Context Menu workaround, thanks Discord.JS
commands.push(
	{
		name: 'log', type: 3,
	},
	{
		name: 'log (delete)', type: 3,
	},
); */

const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);
