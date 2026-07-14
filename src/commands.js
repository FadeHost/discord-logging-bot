import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } from 'discord.js';
import { EVENT_KEYS, getGuild, setChannel, setEvent } from './store.js';

const EVENT_LABELS = {
  memberJoin: 'Member joins',
  memberLeave: 'Member leaves',
  messageDelete: 'Deleted messages',
  messageEdit: 'Edited messages',
  memberBan: 'Bans',
  memberUnban: 'Unbans',
  roleChange: "Members' roles change",
  nicknameChange: 'Nickname changes',
  voice: 'Voice join/leave (noisy)',
};

export const commands = [
  new SlashCommandBuilder()
    .setName('setlog')
    .setDescription('Choose the channel where server activity is logged.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false)
    .addChannelOption((o) =>
      o.setName('channel').setDescription('The log channel').addChannelTypes(ChannelType.GuildText).setRequired(true),
    )
    .toJSON(),
  new SlashCommandBuilder()
    .setName('logtoggle')
    .setDescription('Turn a category of log events on or off.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false)
    .addStringOption((o) =>
      o
        .setName('event')
        .setDescription('Which events')
        .setRequired(true)
        .addChoices(...EVENT_KEYS.map((k) => ({ name: EVENT_LABELS[k], value: k }))),
    )
    .addBooleanOption((o) => o.setName('enabled').setDescription('On or off').setRequired(true))
    .toJSON(),
  new SlashCommandBuilder()
    .setName('logstatus')
    .setDescription('Show the current logging configuration.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false)
    .toJSON(),
];

export async function handleCommand(interaction) {
  const { commandName } = interaction;

  if (commandName === 'setlog') {
    const channel = interaction.options.getChannel('channel');
    await setChannel(interaction.guildId, channel.id);
    return interaction.reply({ content: `✅ Logging to ${channel}.`, ephemeral: true });
  }

  if (commandName === 'logtoggle') {
    const event = interaction.options.getString('event');
    const enabled = interaction.options.getBoolean('enabled');
    await setEvent(interaction.guildId, event, enabled);
    return interaction.reply({
      content: `✅ **${EVENT_LABELS[event]}** logging ${enabled ? 'enabled' : 'disabled'}.`,
      ephemeral: true,
    });
  }

  if (commandName === 'logstatus') {
    const g = await getGuild(interaction.guildId);
    const lines = EVENT_KEYS.map((k) => `${g.events[k] ? '🟢' : '⚪'} ${EVENT_LABELS[k]}`);
    const embed = new EmbedBuilder()
      .setTitle('Logging configuration')
      .setColor(0x5865f2)
      .setDescription(
        `${g.channelId ? `Logging to <#${g.channelId}>` : '⚠️ No log channel set — run `/setlog`.'}\n\n${lines.join('\n')}`,
      );
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  return undefined;
}
