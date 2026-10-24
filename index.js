
const {
  Client,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType
} = require('discord.js');

const fs = require('fs');
const path = require('path');
const http = require('http');

// ==================== الإعدادات ====================

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error('❌ تأكد من إضافة TOKEN و CLIENT_ID في Environment Variables.');
  process.exit(1);
}

const CONFIG_PATH = path.join(__dirname, 'config.json');

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    }
  } catch (error) {
    console.error('خطأ قراءة config.json:', error);
  }

  return { broadcastRoles: [] };
}

let config = loadConfig();

function saveConfig() {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.User]
});

// ==================== الأوامر ====================

const commands = [
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('عرض أوامر البوت'),

  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('معرفة سرعة استجابة البوت'),

  new SlashCommandBuilder()
    .setName('server')
    .setDescription('عرض معلومات السيرفر'),

  new SlashCommandBuilder()
    .setName('setrole')
    .setDescription('السماح لرول باستخدام أوامر البرودكاست')
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('الرول المسموح')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('unsetrole')
    .setDescription('إزالة صلاحية البرودكاست من رول')
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('الرول المراد إزالته')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('bc')
    .setDescription('إرسال برودكاست خاص لأعضاء السيرفر')
    .addStringOption(option =>
      option.setName('title')
        .setDescription('عنوان الإمبد')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('message')
        .setDescription('نص الرسالة')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('color')
        .setDescription('لون الإمبد مثل #4b0d1a')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('image')
        .setDescription('رابط صورة اختياري')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('link')
        .setDescription('رابط اختياري')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('bcrole')
    .setDescription('إرسال برودكاست خاص لأعضاء رول معين')
    .addRoleOption(option =>
      option.setName('target_role')
        .setDescription('الرول المستهدف')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('title')
        .setDescription('عنوان الإمبد')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('message')
        .setDescription('نص الرسالة')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('color')
        .setDescription('لون الإمبد مثل #4b0d1a')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('image')
        .setDescription('رابط صورة اختياري')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('link')
        .setDescription('رابط اختياري')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('lock')
    .setDescription('قفل الروم'),

  new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('فتح الروم'),

  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('حذف رسائل من الروم')
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('عدد الرسائل من 1 إلى 100')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('طرد عضو')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('العضو')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('سبب الطرد')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('حظر عضو')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('العضو')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('سبب الحظر')
        .setRequired(false)
    ), 
    new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('إعطاء عضو تايم أوت')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('العضو')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('minutes')
        .setDescription('المدة بالدقائق، الحد الأقصى 40320')
        .setMinValue(1)
        .setMaxValue(40320)
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('السبب')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('role')
    .setDescription('إعطاء عضو رول')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('العضو')
        .setRequired(true)
    )
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('الرول')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('removerole')
    .setDescription('إزالة رول من عضو')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('العضو')
        .setRequired(true)
    )
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('الرول')
        .setRequired(true)
    )
].map(command => command.toJSON());

// ==================== تسجيل الأوامر ====================

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  client.user.setPresence({
    activities: [{ name: 'Blor System' }],
    status: 'online'
  });

  try {
    const rest = new REST({ version: '10' }).setToken(TOKEN);

    if (GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: commands }
      );
    } else {
      await rest.put(
        Routes.applicationCommands(CLIENT_ID),
        { body: commands }
      );
    }

    console.log('✅ Slash commands registered successfully.');
  } catch (error) {
    console.error('❌ Command registration error:', error);
  }
});

// ==================== أدوات مساعدة ====================

async function replyError(interaction, message) {
  const data = { content: message };

  if (interaction.deferred || interaction.replied) {
    return interaction.followUp({ ...data, ephemeral: true });
  }

  return interaction.reply({ ...data, ephemeral: true });
}

function isAdmin(interaction) {
  return interaction.memberPermissions?.has(
    PermissionFlagsBits.Administrator
  );
}

function canBroadcast(interaction) {
  if (isAdmin(interaction)) return true;

  const allowedRoles = config.broadcastRoles || [];

  return allowedRoles.some(roleId =>
    interaction.member?.roles?.cache?.has(roleId)
  );
}

function validUrl(value) {
  if (!value) return null;

  try {
    const url = new URL(value);

    if (!['http:', 'https:'].includes(url.protocol)) return null;

    return url.toString();
  } catch {
    return null;
  }
}

function makeBroadcastEmbed(interaction) {
  const title = interaction.options.getString('title');
  const message = interaction.options.getString('message');
  const requestedColor = interaction.options.getString('color') || '#4b0d1a';
  const image = interaction.options.getString('image');
  const link = interaction.options.getString('link');

  const color = /^#?[0-9a-fA-F]{6}$/.test(requestedColor)
    ? parseInt(requestedColor.replace('#', ''), 16)
    : 0x4b0d1a;

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title.slice(0, 256))
    .setDescription(message.slice(0, 4000))
    .setFooter({
      text: interaction.guild.name
    })
    .setTimestamp();

  const imageUrl = validUrl(image);
  const linkUrl = validUrl(link);

  if (imageUrl) embed.setImage(imageUrl);
  if (linkUrl) embed.setURL(linkUrl);

  return embed;
}

async function sendBroadcast(interaction, targetRoleId = null) {
  if (!canBroadcast(interaction)) {
    return replyError(
      interaction,
      '❌ ما عندك صلاحية استخدام أوامر البرودكاست. اطلب من الإدارة إضافة رولك باستخدام /setrole.'
    );
  }

  await interaction.deferReply({ ephemeral: true });

  const guild = interaction.guild;

  if (!guild) {
    return interaction.editReply('❌ هذا الأمر يعمل داخل السيرفر فقط.');
  }

  let members;

  try {
    await guild.members.fetch();
    members = guild.members.cache.filter(member => !member.user.bot);

    if (targetRoleId) {
      members = members.filter(member =>
        member.roles.cache.has(targetRoleId)
      );
    }
  } catch (error) {
    console.error('خطأ جلب الأعضاء:', error);
    return interaction.editReply('❌ ما قدرت أجيب قائمة الأعضاء.');
  }

  const embed = makeBroadcastEmbed(interaction);
  let sent = 0;
  let failed = 0;

  for (const member of members.values()) {
    try {
      await member.send({ embeds: [embed] });
      sent++;
    } catch {
      failed++;
    }
  }

  return interaction.editReply(
    `✅ انتهى البرودكاست.\n📨 تم الإرسال: ${sent}\n❌ تعذر الإرسال: ${failed}`
  );
}
// ==================== تنفيذ الأوامر ====================

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const name = interaction.commandName;

  try {
    if (!interaction.guild) {
      return replyError(interaction, '❌ استخدم الأمر داخل السيرفر.');
    }

    // help
    if (name === 'help') {
      const embed = new EmbedBuilder()
        .setColor(0x4b0d1a)
        .setTitle('Blor System | الأوامر')
        .setDescription([
          '`/help` عرض الأوامر',
          '`/ping` سرعة البوت',
          '`/server` معلومات السيرفر',
          '`/setrole` السماح لرول بالبرودكاست',
          '`/unsetrole` إزالة صلاحية البرودكاست',
          '`/bc` برودكاست خاص لجميع الأعضاء',
          '`/bcrole` برودكاست خاص لرول محدد',
          '`/lock` قفل الروم',
          '`/unlock` فتح الروم',
          '`/clear` حذف رسائل',
          '`/kick` طرد عضو',
          '`/ban` حظر عضو',
          '`/timeout` تايم أوت',
          '`/role` إعطاء رول',
          '`/removerole` إزالة رول'
        ].join('\n'));

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ping
    if (name === 'ping') {
      return interaction.reply(
        `🏓 سرعة استجابة البوت: ${client.ws.ping}ms`
      );
    }

    // server
    if (name === 'server') {
      const guild = interaction.guild;

      const embed = new EmbedBuilder()
        .setColor(0x4b0d1a)
        .setTitle(guild.name)
        .addFields(
          {
            name: 'عدد الأعضاء',
            value: `${guild.memberCount}`,
            inline: true
          },
          {
            name: 'معرّف السيرفر',
            value: guild.id,
            inline: true
          },
          {
            name: 'تاريخ إنشاء السيرفر',
            value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`,
            inline: true
          }
        );

      if (guild.iconURL()) embed.setThumbnail(guild.iconURL());

      return interaction.reply({ embeds: [embed] });
    }

    // setrole
    if (name === 'setrole') {
      if (!isAdmin(interaction)) {
        return replyError(interaction, '❌ هذا الأمر للإدارة فقط.');
      }

      const role = interaction.options.getRole('role');

      if (!config.broadcastRoles.includes(role.id)) {
        config.broadcastRoles.push(role.id);
        saveConfig();
      }

      return interaction.reply({
        content: `✅ تم السماح للرول ${role} باستخدام أوامر البرودكاست.`,
        ephemeral: true
      });
    }

    // unsetrole
    if (name === 'unsetrole') {
      if (!isAdmin(interaction)) {
        return replyError(interaction, '❌ هذا الأمر للإدارة فقط.');
      }

      const role = interaction.options.getRole('role');

      config.broadcastRoles = config.broadcastRoles.filter(
        id => id !== role.id
      );

      saveConfig();

      return interaction.reply({
        content: `✅ تمت إزالة صلاحية البرودكاست من ${role}.`,
        ephemeral: true
      });
    }

    // bc
    if (name === 'bc') {
      return sendBroadcast(interaction);
    }

    // bcrole
    if (name === 'bcrole') {
      const role = interaction.options.getRole('target_role');

      return sendBroadcast(interaction, role.id);
    }

    // lock / unlock
    if (name === 'lock' || name === 'unlock') {
      if (!interaction.memberPermissions.has(
        PermissionFlagsBits.ManageChannels
      )) {
        return replyError(
          interaction,
          '❌ تحتاج صلاحية Manage Channels.'
        );
      }

      const channel = interaction.channel;
      const shouldLock = name === 'lock';

      if (
        channel.type === ChannelType.GuildVoice ||
        channel.type === ChannelType.GuildStageVoice
      ) {
        await channel.permissionOverwrites.edit(
          interaction.guild.roles.everyone.id,
          {
            Connect: shouldLock ? false : null
          }
        );
      } else {
        await channel.permissionOverwrites.edit(
          interaction.guild.roles.everyone.id,
          {
            SendMessages: shouldLock ? false : null
          }
        );
      }

      return interaction.reply(
        shouldLock
          ? '🔒 تم قفل الروم.'
          : '🔓 تم فتح الروم.'
      );
    }

    // clear
    if (name === 'clear') {
      if (!interaction.memberPermissions.has(
        PermissionFlagsBits.ManageMessages
      )) {
        return replyError(interaction, '❌ تحتاج صلاحية Manage Messages.');
      }

      const amount = interaction.options.getInteger('amount');

      const deleted = await interaction.channel.bulkDelete(amount, true);

      return interaction.reply({
        content: `🧹 تم حذف ${deleted.size} رسالة.`,
        ephemeral: true
      });
    }

    // kick
    if (name === 'kick') {
      if (!interaction.memberPermissions.has(PermissionFlagsBits.KickMembers)) {
        return replyError(interaction, '❌ تحتاج صلاحية Kick Members.');
      }

      const user = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason') || 'بدون سبب';
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);

      if (!member) {
        return replyError(interaction, '❌ العضو غير موجود في السيرفر.');
      }

      await member.kick(reason);

      return interaction.reply(`👢 تم طرد ${user.tag}.\nالسبب: ${reason}`);
    }

    // ban
    if (name === 'ban') {
      if (!interaction.memberPermissions.has(PermissionFlagsBits.BanMembers)) {
        return replyError(interaction, '❌ تحتاج صلاحية Ban Members.');
      }

      const user = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason') || 'بدون سبب';

      await interaction.guild.members.ban(user.id, { reason });

      return interaction.reply(`🔨 تم حظر ${user.tag}.\nالسبب: ${reason}`);
    }
        // timeout
    if (name === 'timeout') {
      if (!interaction.memberPermissions.has(
        PermissionFlagsBits.ModerateMembers
      )) {
        return replyError(interaction, '❌ تحتاج صلاحية Moderate Members.');
      }

      const user = interaction.options.getUser('user');
      const minutes = interaction.options.getInteger('minutes');
      const reason = interaction.options.getString('reason') || 'بدون سبب';

      const member = await interaction.guild.members.fetch(user.id).catch(() => null);

      if (!member) {
        return replyError(interaction, '❌ العضو غير موجود في السيرفر.');
      }

      await member.timeout(minutes * 60 * 1000, reason);

      return interaction.reply(
        `⏳ تم إعطاء ${user.tag} تايم أوت لمدة ${minutes} دقيقة.`
      );
    }

    // role / removerole
    if (name === 'role' || name === 'removerole') {
      if (!interaction.memberPermissions.has(
        PermissionFlagsBits.ManageRoles
      )) {
        return replyError(interaction, '❌ تحتاج صلاحية Manage Roles.');
      }

      const user = interaction.options.getUser('user');
      const role = interaction.options.getRole('role');
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);

      if (!member) {
        return replyError(interaction, '❌ العضو غير موجود في السيرفر.');
      }

      if (role.managed || role.id === interaction.guild.id) {
        return replyError(interaction, '❌ لا يمكن تعديل هذا الرول.');
      }

      if (
        interaction.guild.members.me.roles.highest.comparePositionTo(role) <= 0
      ) {
        return replyError(
          interaction,
          '❌ لازم يكون أعلى رول للبوت أعلى من الرول المطلوب.'
        );
      }

      if (name === 'role') {
        await member.roles.add(role);
        return interaction.reply(`✅ تم إعطاء ${user} الرول ${role}.`);
      }

      await member.roles.remove(role);
      return interaction.reply(`✅ تمت إزالة الرول ${role} من ${user}.`);
    }
  } catch (error) {
    console.error(`Command error (${name}):`, error);

    if (interaction.deferred) {
      return interaction.editReply(
        '❌ صار خطأ أثناء تنفيذ الأمر. تأكد من صلاحيات البوت والرولات.'
      ).catch(() => {});
    }

    return replyError(
      interaction,
      '❌ صار خطأ أثناء تنفيذ الأمر. راجع صلاحيات البوت وسجل الأخطاء.'
    ).catch(() => {});
  }
});

// ==================== تشغيل البوت ====================

const PORT = process.env.PORT || 10000;

http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf-8'
  });
  res.end('Blor System is online!');
}).listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 HTTP server listening on port ${PORT}`);
});

client.login(TOKEN).catch(error => {
  console.error('❌ Discord login failed:', error);
  process.exit(1);
});
