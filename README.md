# LoMMuS
May God have mercy on your soul, for LoMMuS sure as hell won't.

Resident ~~annoyance~~ functionality bot for the LMMS Discord server. Allows literally 1984 to happen by logging everything and deleting also everything when the nitro spam filter breaks. Updated on a semi-completely disorderly fashion by Kev[^1].
[^1]: Feedback not welcome. Mostly.

> LoMMuS turned my whole life around! Best thing Kev has ever done in his whole life, by far! -somebody

## Features
- [ ] Excessive logging
	- [x] Messages
	- [x] Members
	- [x] Spam
	- [ ] Threads

- [ ] Moderation
	- [x] User report command
	- [ ] Modmail bot replacement
	- [ ] Chat control, message purging and logging
	- [x] Server info embed, on demand rules and channel list embeds

- [ ] Actual Functionality
	- [x] 25 user selectable color roles
	- [x] Parses GitHub Issue/Pull Request tags (#6069, etc)
	- [x] Starboard (Lomboard)
	- [x] Information Commands
	- [ ] Polls
	- [ ] Threads (low priority)

- [x] Amogus

## Command Handbook
For people that can't read the slash command and option descriptions.
#### /rule [number]
- One argument: the number of the rule you wish to display publicly in chat
#### /rulelist
- Privately displays the server rules
#### /channels
- Privately displays the server channel directory
#### /color
- You literally can't mess this one up. Just use /color. Now with 100% more random button
#### /report [user] [message] [details]
- Use this command to report a user and message to the moderators. Three arguments:
- Three arguments:
  - **user:** must be a mention or a snowflake (ID)
  - **message:** must be a URL to a message via message link or share (on mobile)
  - **details:** provide some info about who/what you are reporting
#### /whois [user]
- One argument: a user mention or snowflake
#### /bot
- Shows this very README.md and a condensed changelog
#### /server
- Shows some basic server information
#### /topic
- Outputs the channel topic in the chat
