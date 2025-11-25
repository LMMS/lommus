<div align="center">

<h1>
<img src="lommus.webp" alt="LoMMuS icon" width="60px" /><br>LoMMuS
</h1>
<p>Discord bot</p>
<p>
<a href="https://discord.gg/3sc5su7"><img src="https://img.shields.io/badge/chat-on%20discord-7289DA.svg" alt="Join the chat at Discord"></a>
</p>

</div>

Welcome to LMMS's LoMMuS repository. **LoMMuS** is our Discord bot formerly operated and developed by [StakeoutPunch](https://github.com/StakeoutPunch), it is now maintained by the larger LMMS developers.

**Read the [wiki](//github.com/LMMS/lommus/wiki) for instructions on how to set up and deploy LoMMuS.**

Feel free to contribute and make PRs.

The old README is located in [README.old.md](README.old.md), which displays notes and commands available at the time.

## Features

- Useful slash commands for general use and debugging
  - Print the server's rules
  - Say something as the bot
  - Get a list of the server's channels
  - Get the user info of a given user
  - Get information about the server
  - Get information about the bot
  - Display the topic of the channel
  - Restart the bot
  - Kill the bot
- A Starboard we call "Lomboard"
- Fetch GitHub issue and PR tickets
  - Type `org-name/repo-name#xxx` or `#xxx` to use it. The specifier must have at least 3 numbers to be detected by the bot. Left pad the ticket number with zeroes if you're referencing an issue/ticket that's less than 100 (e.g. `#090`, `#005`)
- Basic anti-spam features
- Server logging functionality

## Developing

The bot uses standard NodeJS APIs and is intended to run normally everywhere using any Node-like runtimes like Deno and Bun. You may use other runtimes/package managers while developing LoMMuS, just make sure to ensure compatibility with standard NodeJS.

### TypeScript

This repository uses TypeScript's type hinting features to ease development. However, please do not use TypeScript code.
