import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

// Per-guild settings persist to the FadeHost bot's /data volume, which
// survives restarts and redeploys. Env vars provide the initial defaults;
// once an admin runs /setlog or /logtoggle, the stored value wins.
const DATA_FILE = process.env.CONFIG_PATH || '/data/logging-config.json';

// The event categories admins can switch on and off.
export const EVENT_KEYS = [
  'memberJoin',
  'memberLeave',
  'messageDelete',
  'messageEdit',
  'memberBan',
  'memberUnban',
  'roleChange',
  'nicknameChange',
  'voice',
];

let cache = null;

async function load() {
  if (cache) return cache;
  try {
    cache = JSON.parse(await readFile(DATA_FILE, 'utf8'));
  } catch {
    cache = { guilds: {} };
  }
  return cache;
}

async function persist() {
  try {
    await mkdir(dirname(DATA_FILE), { recursive: true });
    await writeFile(DATA_FILE, JSON.stringify(cache, null, 2));
  } catch (err) {
    console.error('[logging-bot] could not save config:', err.message);
  }
}

function defaults() {
  // Everything on by default except the noisier voice events.
  const events = {};
  for (const key of EVENT_KEYS) events[key] = key !== 'voice';
  return {
    channelId: (process.env.LOG_CHANNEL_ID || '').trim() || null,
    events,
  };
}

export async function getGuild(guildId) {
  const data = await load();
  if (!data.guilds[guildId]) {
    data.guilds[guildId] = defaults();
    await persist();
  }
  return data.guilds[guildId];
}

export async function setChannel(guildId, channelId) {
  const g = await getGuild(guildId);
  g.channelId = channelId;
  await persist();
}

export async function setEvent(guildId, key, enabled) {
  const g = await getGuild(guildId);
  g.events[key] = enabled;
  await persist();
}
