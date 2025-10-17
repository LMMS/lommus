import * as dotenv from 'dotenv';
dotenv.config({ path: __dirname.concat('/.env'), quiet: true });
import fs from 'node:fs';
import { Client, Events, Collection, GatewayIntentBits, EmbedBuilder, Partials, ActivityType } from 'discord.js';
import config from './config.json' with { type: 'json' };

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
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
	// Get guild from client in order to set initial activity status
	const guild = client.guilds.cache.get(config.guildId);

	if (!client.user) {
		console.error("client.user not defined! Did the authentication fail?");
		return;
	}
	if (!guild) {
		console.error("guild is not defined! Is the bot joined to any server?");
		return;
	}

	console.log(`Ready! Logged in as ${client.user.tag}`);

	client.user.setActivity(`${guild.memberCount} LeMMingS`, { type: ActivityType.Watching });

	// Collect module files from directory
	client.addons = new Collection();
	const addonFiles = fs.readdirSync('./modules').filter(file => file.endsWith('.mjs'));
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
client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction || !interaction.channel || !interaction.guild) {
		console.error("Interaction is not configured correctly! Has slash commands been registered yet?");
		return;
	}

	// Screen bad command interactions
	if (!interaction.isChatInputCommand()) return;

	// Restart bot
	if (interaction.commandName === 'restart') {
		const embed = new EmbedBuilder()
			.setAuthor({ name: 'Restarting', iconURL: interaction.guild.iconURL({ size: 64 }) })
			.setColor(config.red)
			.setDescription('Was I a Good Bot?');

		await interaction.reply({ embeds: [embed], ephemeral: true })
			// Exit process, loop.sh container will restart bot automatically
			.then(async () => {
				console.log("Exiting...");
				process.exit(0);
			})
			.catch(error => {
				console.error('Unable to restart!', error);
			});
	}

	// Chat as bot
	if (interaction.commandName === 'say') {
		const msg = interaction.options.getString('message');

		// await interaction.reply({ content: 'Done. Dismiss this message.', ephemeral: true });
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
				.setColor(config.red)
				.setDescription('Color randomization disabled.');
			if (global.colorRandom) {
				embed.setColor(config.green);
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
process.on('unhandledRejection', (error) => console.error('Uncaught Promise rejection:\n', error));

client.login(process.env.TOKEN);
