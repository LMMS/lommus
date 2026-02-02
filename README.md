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

**Read the [wiki](https://github.com/LMMS/lommus/wiki) for instructions on how to set up and deploy LoMMuS.** This README only shows development instructions.

Feel free to contribute and make PRs.

The old README is located in [README.old.md](README.old.md), which displays notes and commands available at the time.

<div align="center">

*LoMMuS runs on DigitalOcean. Click the button below for more information, or access this link: https://m.do.co/c/c77894a32e56. Both will utilize our referral code.*

[![DigitalOcean Referral Badge](https://web-platforms.sfo2.cdn.digitaloceanspaces.com/WWW/Badge%201.svg)](https://www.digitalocean.com/?refcode=c77894a32e56&utm_campaign=Referral_Invite&utm_medium=Referral_Program&utm_source=badge)

</div>

## Developing

The bot uses standard Node.JS APIs and is intended to run normally everywhere using any Node-like runtimes like Deno and Bun. You may use other runtimes/package managers while developing LoMMuS, just make sure to ensure compatibility with standard Node.JS.

### TypeScript

This repository uses TypeScript :D

### Modules

Functionality to the bot is added via file-separated [`BotModules`](modules/util/module.mts), which are then loaded via [`lommus.ts`](lommus.ts) using dynamic imports. This enables rapid development and logic decoupling.

All `BotModules` require an `init()` method to be implemented, (because it is the method that gets invoked after the class is instantiated). The order of execution is:

1. Module import
    * Using ESM dynamic import
2. Default instantiation
    * Class construction is used to populate internal data using the passed `Client` data, e.g. for loading server assets, caching channels, etc.
3. `init()` call
    * Registration of event listeners and active logic should be performed here, as this is performed at the very last of the module loading process, ensuring all data has properly loaded. The method does not expect any return value, nor does it enforce void returns

Module files must use the `.mts` extension. `.mjs` files may exist as legacy modules, but they should be disabled via module config.
