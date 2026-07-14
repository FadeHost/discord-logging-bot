import { Client, GatewayIntentBits, Partials, Events, REST, Routes } from 'discord.js';
import { commands, handleCommand } from './src/commands.js';
import { registerEvents } from './src/events.js';

const token = (process.env.DISCORD_TOKEN || '').trim();
if (!token) {
  console.error('[logging-bot] DISCORD_TOKEN is not set. Add your bot token in the FadeHost panel → your bot → Environment.');
  process.exit(1);
}

// These need the matching PRIVILEGED intents enabled in the Discord Developer
// Portal (Bot → Privileged Gateway Intents): Server Members + Message Content.
// Partials let us log deletes/edits of messages that aren't in the cache.
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember, Partials.User],
});

client.once(Events.ClientReady, async (c) => {
  console.log(`[logging-bot] online as ${c.user.tag} in ${c.guilds.cache.size} server(s)`);
  c.user.setActivity('the server', { type: 3 }); // "Watching the server"
  try {
    const rest = new REST().setToken(token);
    await rest.put(Routes.applicationCommands(c.user.id), { body: commands });
    console.log('[logging-bot] slash commands registered');
  } catch (err) {
    console.error('[logging-bot] failed to register commands:', err.message);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  try {
    await handleCommand(interaction);
  } catch (err) {
    console.error('[logging-bot] command error:', err);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '⚠️ Something went wrong.', ephemeral: true }).catch(() => {});
    }
  }
});

registerEvents(client, Events);

client.login(token);

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    console.log(`[logging-bot] ${signal} received, shutting down`);
    client.destroy();
    process.exit(0);
  });
}
