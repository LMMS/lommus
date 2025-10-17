<div align="center">

<h1>
<img src="lommus.webp" alt="LoMMuS icon" width="60px" /><br>LoMMuS
</h1>
<p>Discord bot</p>

</div>

Welcome to LMMS's LoMMuS repository. **LoMMuS** is our Discord bot formerly operated and developed by [StakeoutPunch](https://github.com/StakeoutPunch), it is now maintained by the larger LMMS developers.

Feel free to contribute and make PRs.

The old README is located in [README.old.md](README.old.md), which displays notes and commands available at the time.

- [Deployment](#deployment)
	- [Setting up auth](#setting-up-auth)
	- [Setting up bot configuration](#setting-up-bot-configuration)
	- [Registering slash commands](#registering-slash-commands)
	- [Running the bot](#running-the-bot)
- [Developing](#developing)

## Deployment

Clone the repository, then install the dependencies.

### Setting up auth

LoMMuS requires two tokens for it to function correctly:

1. Discord Application Token (bot token).
   - Get it by creating an Application at <https://discord.com/developers/applications>
2. GitHub Personal Access Token, used for fetching GitHub issue and PR details.
   - Get it by creating a classic Personal Access Token at <https://github.com/settings/tokens>.
   - You just need the token to have the `public_repo` scope, nothing more

These two tokens must be placed inside an `.env` file at the root of the repository. You'll need to create it yourself.

See the given [`.env.example`](.env.example) file for an example.

**DO NOT COMMIT AND/OR EXPOSE THE ACTUAL `.env` FILE. EVER.** There's a reason it is `.gitignore`d. If any of the credentials are leaked or otherwise exposed, *stop the bot and rotate the credentials immediately.*

### Setting up bot configuration

LoMMuS requires a `config.json` file at the root of the repository that contains some values. See [`config.json.example`](config.json) for an example.

Note that the only real values needing changes are:

- `ownerId`
- `clientId`
- `guildId`

Changing the color values here is permitted, just make sure they're HEX-formatted.

### Registering slash commands

LoMMuS provides some slash command functionality, which is able to be deployed using [`deploy-commands.js`](deploy-commands.js). Run the script first before running the bot to register slash commands to Discord.

The script is independent of the other modules and handles authentication by itself.

### Running the bot

While it is possible to just run `lommus.js` directly using your favourite runner, we've provided some scripts that should help you run the bot.

| Windows | Linux |
| - | - |
| Run [`_win_run.bat`](scripts/_win_run.bat)<br><details><summary>**Note**</summary> This batch script is very rudimentary, and may not work as you expect it to</details> | Run [`run.sh`](scripts/run.sh) |

## Developing
