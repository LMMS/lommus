require('dotenv').config();
const fs = require('fs');
// const db = require('quick.db');
const { Client, Events, Collection, GatewayIntentBits, EmbedBuilder, Partials, ActivityType } = require('discord.js');
const { guildId, green, red } = require('./config.json');
// const delay = ms => new Promise(res => setTimeout(res, ms));
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildBans,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildModeration,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.DirectMessages,
	],
	partials: [
		Partials.Message,
		Partials.Channel,
		Partials.Reaction,
	],
});

// Fires when bot successfully authenticates via token
client.once(Events.ClientReady, async () => {
	console.log(`Ready! Logged in as ${client.user.tag}`);
	// Get guild from client in order to set initial activity status. Use cache, if not in cache fetch from API
	const guild = client.guilds.cache.get(guildId) ?? await client.guilds.fetch(guildId);

    client.user.setActivity(`${guild.memberCount} LeMMingS`, { type: ActivityType.Watching });

	// Collect module files from directory
	client.addons = new Collection();
	const addonFiles = fs.readdirSync('./modules').filter(file => file.endsWith('.js'));
	// Loop Collection of module files
	for (const file of addonFiles) {
		// Map
		const addon = require(`./modules/${file}`);
		client.addons.set(addon.name, addon);

		// Execute module.export code from module files
		try {
			client.addons.get(addon.name).execute(client);
			console.log(addon.name + ' module loaded.');
		}
		catch (error) {
			console.error(error);
		}
	}
});

// Fires once for each slash command sent by users
client.on(Events.InteractionCreate, async interaction => {
	// Screen bad command interactions
	if (!interaction.isChatInputCommand()) return;

	// Restart bot
	if (interaction.commandName === 'restart') {
		const embed = new EmbedBuilder()
			.setAuthor({ name: 'Restarting', inconURL: interaction.guild.iconURL({ size: 64, dynamic: true }) })
			.setColor(red)
			.setDescription('Was I a Good Bot?');

		await interaction.reply({ embeds: [embed], ephemeral: true })
			// Exit process, loop.sh container will restart bot automatically
			.then(async () => {
				await process.exit();
			})
			.catch(error => {
				console.error('Unable to restart!', error);
			});
	}

	// Chat as bot
	if (interaction.commandName === 'say') {
		const msg = interaction.options.getString('message');

		await interaction.reply({ content: 'Done. Dismiss this message.', ephemeral: true });
		interaction.channel.send({ content: msg });
	}

	// Toggle various global booleans
	if (interaction.commandName === 'toggle') {
		const toggleType = interaction.options.getString('function');
		// Color randomization toggle
		if (toggleType === 'toggle_color') {
			// flip
			global.colorRandom = !global.colorRandom;

			const embed = new EmbedBuilder()
				.setColor(red)
				.setDescription('Color randomization disabled.');
			if (global.colorRandom) {
				embed.setColor(green);
				embed.setDescription('Color randomization enabled.');
			}
			await interaction.reply({ embeds: [embed], ephemeral: true });
		}
	}
});

// Defunct Command handler (works the same as the module loader above)
/* const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
	const event = require(`./events/${file}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	}
	else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
}
*/

// generic error handling
process.on('unhandledRejection', error => console.error('Uncaught Promise Rejection\n', error));

client.login(process.env.TOKEN);
