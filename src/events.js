import { EmbedBuilder, AuditLogEvent } from 'discord.js';
import { getGuild } from './store.js';

const COLORS = {
  add: 0x57f287, // green
  remove: 0xed4245, // red
  edit: 0xfee75c, // yellow
  neutral: 0x5865f2, // blurple
};

/** Send an embed to a guild's configured log channel, if the category is on. */
async function log(guild, eventKey, embed) {
  const cfg = await getGuild(guild.id);
  if (!cfg.channelId || !cfg.events[eventKey]) return;

  const channel = guild.channels.cache.get(cfg.channelId) ?? (await guild.channels.fetch(cfg.channelId).catch(() => null));
  if (!channel || !channel.isTextBased()) return;

  embed.setTimestamp();
  await channel.send({ embeds: [embed] }).catch(() => {});
}

function base(color, author) {
  const embed = new EmbedBuilder().setColor(color);
  if (author) embed.setAuthor({ name: author.tag, iconURL: author.displayAvatarURL?.() });
  return embed;
}

export function registerEvents(client, Events) {
  client.on(Events.GuildMemberAdd, (member) => {
    const created = Math.floor(member.user.createdTimestamp / 1000);
    log(member.guild, 'memberJoin',
      base(COLORS.add, member.user)
        .setTitle('📥 Member joined')
        .setDescription(`${member} (${member.user.tag})\nAccount created <t:${created}:R>`));
  });

  client.on(Events.GuildMemberRemove, (member) => {
    const roles = member.roles?.cache?.filter((r) => r.id !== member.guild.id).map((r) => r.toString()).join(', ');
    log(member.guild, 'memberLeave',
      base(COLORS.remove, member.user)
        .setTitle('📤 Member left')
        .setDescription(`${member.user.tag}${roles ? `\nHad roles: ${roles}` : ''}`));
  });

  client.on(Events.MessageDelete, (message) => {
    if (!message.guild || message.author?.bot) return;
    const content = message.content ? message.content.slice(0, 1000) : '*no text content*';
    log(message.guild, 'messageDelete',
      base(COLORS.remove, message.author ?? undefined)
        .setTitle('🗑️ Message deleted')
        .setDescription(`In ${message.channel}\n\n${content}`));
  });

  client.on(Events.MessageUpdate, (oldMessage, newMessage) => {
    if (!newMessage.guild || newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return; // embeds/attachments only
    log(newMessage.guild, 'messageEdit',
      base(COLORS.edit, newMessage.author ?? undefined)
        .setTitle('✏️ Message edited')
        .setDescription(`In ${newMessage.channel} · [jump](${newMessage.url})`)
        .addFields(
          { name: 'Before', value: (oldMessage.content || '*unknown*').slice(0, 1000) },
          { name: 'After', value: (newMessage.content || '*empty*').slice(0, 1000) },
        ));
  });

  client.on(Events.GuildBanAdd, (ban) => {
    log(ban.guild, 'memberBan',
      base(COLORS.remove, ban.user).setTitle('🔨 Member banned').setDescription(ban.user.tag));
  });

  client.on(Events.GuildBanRemove, (ban) => {
    log(ban.guild, 'memberUnban',
      base(COLORS.add, ban.user).setTitle('♻️ Member unbanned').setDescription(ban.user.tag));
  });

  client.on(Events.GuildMemberUpdate, (oldMember, newMember) => {
    // Roles
    const before = oldMember.roles.cache;
    const after = newMember.roles.cache;
    const added = after.filter((r) => !before.has(r.id)).map((r) => r.toString());
    const removed = before.filter((r) => !after.has(r.id)).map((r) => r.toString());
    if (added.length || removed.length) {
      log(newMember.guild, 'roleChange',
        base(COLORS.neutral, newMember.user)
          .setTitle('🎭 Roles updated')
          .setDescription(`${newMember}\n${added.length ? `**+** ${added.join(', ')}\n` : ''}${removed.length ? `**−** ${removed.join(', ')}` : ''}`));
    }
    // Nickname
    if (oldMember.nickname !== newMember.nickname) {
      log(newMember.guild, 'nicknameChange',
        base(COLORS.edit, newMember.user)
          .setTitle('🏷️ Nickname changed')
          .setDescription(`${newMember}\n\`${oldMember.nickname ?? '(none)'}\` → \`${newMember.nickname ?? '(none)'}\``));
    }
  });

  client.on(Events.VoiceStateUpdate, (oldState, newState) => {
    const user = newState.member?.user;
    if (!user) return;
    if (!oldState.channel && newState.channel) {
      log(newState.guild, 'voice', base(COLORS.add, user).setTitle('🔊 Joined voice').setDescription(`${newState.channel}`));
    } else if (oldState.channel && !newState.channel) {
      log(oldState.guild, 'voice', base(COLORS.remove, user).setTitle('🔇 Left voice').setDescription(`${oldState.channel}`));
    } else if (oldState.channelId !== newState.channelId) {
      log(newState.guild, 'voice', base(COLORS.neutral, user).setTitle('🔀 Moved voice').setDescription(`${oldState.channel} → ${newState.channel}`));
    }
  });
}

// Kept for a future enhancement: attribute deletes/bans to the moderator via
// the audit log. Exported so the reference isn't flagged as unused.
export { AuditLogEvent };
