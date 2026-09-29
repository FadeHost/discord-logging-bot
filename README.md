# FadeHost Logging Bot

[![Deploy to FadeHost](https://fadehost.com/deploy-button.svg)](https://laplace.fadehost.com/register?intent=bot&repo=https://github.com/FadeHost/discord-logging-bot)

A server audit-log bot for Discord. Logs joins, leaves, deleted/edited messages, bans, role changes, nickname changes and voice activity to a channel of your choice.

## Setup on FadeHost
1. Create a bot at https://discord.com/developers/applications → **New Application → Bot → Reset Token**.
2. Under **Bot → Privileged Gateway Intents**, enable **Server Members Intent** and **Message Content Intent**.
3. Invite it with the `applications.commands` scope and permission to read the channels you want logged.
4. In your FadeHost panel, deploy the **Logging Bot** template and paste the token as `DISCORD_TOKEN`.
5. In Discord, run `/setlog #your-log-channel`. Use `/logtoggle` to turn categories on/off and `/logstatus` to review.

## Environment variables
| Variable | Default | What it does |
|---|---|---|
| `DISCORD_TOKEN` | — | **Required.** Your bot token. |
| `LOG_CHANNEL_ID` | — | Optional default log channel (or just use `/setlog`). |

Settings are saved to the bot's persistent storage, so they survive restarts. Voice logging is off by default (it's noisy) — enable it with `/logtoggle`.

Built and maintained by [FadeHost](https://fadehost.com). MIT licensed.
