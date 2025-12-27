import * as dotenv from 'dotenv';
dotenv.config({ quiet: true });
import { SlashCommandBuilder, PermissionFlagsBits, Routes, REST } from 'discord.js';
import { config } from './modules/util/config.mjs';

// Manual command builder for now
const commands = [
	// dump
	new SlashCommandBuilder()
		.setName('dump')
		.setDescription('Dumps info about the bot'),

	new SlashCommandBuilder()
		.setName('file')
		.setDescription('Get a given file ')
		.addStringOption((option) =>
			option
				.setName('path')
				.setDescription('The path to the file')
				.setRequired(true)
				.setMaxLength(4095)
		)
		.addStringOption((option) =>
			option
				.setName('line')
				.setDescription('The line(s) to fetch. Format: 12 or 20-30')
				.setRequired(false)
		)
		.addStringOption((option) =>
			option
				.setName('org')
				.setDescription("Can short-circuit with 'org/repo'. Defaults to 'LMMS'")
				.setRequired(false)
				.setMinLength(3)
				.setMaxLength(39)
		)
		.addStringOption((option) =>
			option
				.setName('repo')
				.setDescription("The repository to fetch the file from. Defaults to 'lmms'")
				.setRequired(false)
				.setMinLength(1)
				.setMaxLength(100)
		),

	// restart
	new SlashCommandBuilder()
		.setName('restart')
		.setDescription('Bippidy Boppidy Ska'),

	new SlashCommandBuilder()
		.setName('reload')
		.setDescription('Reloads all of the bot\'s modules'),

	// kill bot
	new SlashCommandBuilder()
		.setName('kill')
		.setDescription('Was I not good enough?'),

	// say
	new SlashCommandBuilder()
		.setName('say')
		.setDescription('say something as the bot')
		.addStringOption(option =>
			option.setName('message')
				.setDescription('what LoMMuS should say')
				.setRequired(true))
		.addChannelOption(option =>
			option.setName('channel')
				.setDescription("Defaults to this channel")
				.setRequired(false)
		),

	// info embed
	new SlashCommandBuilder()
		.setName('infoembed')
		.setDescription('generate the LMMS server info embed')
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

	new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Get latency measurements'),

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

	new SlashCommandBuilder()
		.setName('nightly')
		.setDescription('Give information about LMMS\'s nightly builds'),

	// toggle
	new SlashCommandBuilder()
		.setName('toggle')
		.setDescription('( ͡°( ͡° ͜ʖ( ͡° ͜ʖ ͡°)ʖ ͡°) ͡°)')
		.addStringOption(option =>
			option.setName('function')
				.setDescription('functionality to toggle')
				.setRequired(true)
			// .addChoices(
			// { name: 'color', value: 'toggle_color' },
			// )
		),

	// whois
	new SlashCommandBuilder()
		.setName('whois')
		.setDescription('get info about a user')
		.addUserOption(option =>
			option.setName('user')
				.setDescription('user mention or ID')
				.setRequired(true)),

	// server
	new SlashCommandBuilder()
		.setName('server')
		.setDescription('get info about the server'),

	// bot
	new SlashCommandBuilder()
		.setName('bot')
		.setDescription('get info about this bot'),

	// topic
	new SlashCommandBuilder()
		.setName('topic')
		.setDescription('briefly display topic of channel'),
].map(command => command.toJSON());


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

if (process.env.TOKEN) {
	const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

	rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body: [] })
		.then(() => console.log('Deleted registered application commands, registering again...'))
		.catch(console.error);

	rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body: commands })
		.then(() => console.log('Successfully registered application commands'))
		.catch(console.error);
} else {
	console.error("Token is missing!");
}
