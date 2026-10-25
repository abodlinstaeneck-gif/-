const {
  Client,
  GatewayIntentBits,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  REST,
  Routes,
  SlashCommandBuilder
} = require('discord.js');

const fs = require('node:fs');
const path = require('node:path');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID || '';
const BOT_NAME = 'Blor System';
const CONFIG_FILE = path.join(__dirname, 'config.json');

if (!TOKEN || !CLIENT_ID) {
  console.error('Missing TOKEN or CLIENT_ID in environment variables.');
  process.exit(1);
}

const DEFAULT_TEXT_COMMANDS = {
  help: 'help',
  ping: 'ping',
  server: 'server',
  lock: 'lock',
  unlock: 'unlock',
  clear: 'clear',
  kick: 'kick',
  ban: 'ban',
  timeout: 'timeout',
  role: 'role',
  removerole: 'removerole',
  bc: 'bc',
  bcrole: 'bcrole',
  setprefix: 'setprefix',
  setcmd: 'setcmd'
};

let config = {
  allowedRoles: {},
  prefix: '!',
  textCommands: { ...DEFAULT_TEXT_COMMANDS }
};

try {
  if (fs.existsSync(CONFIG_FILE)) {
    config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    if (!config.allowedRoles) config.allowedRoles = {};
    if (!config.prefix) config.prefix = '!';
    config.textCommands = {
      ...DEFAULT_TEXT_COMMANDS,
      ...(config.textCommands || {})
    };
  }
} catch (error) {
  console.error('Error reading config.json:', error.message);
}

function saveConfig() {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const commands = [
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('عرض أوامر البوت'),

  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('سرعة استجابة البوت'),

  new SlashCommandBuilder()
    .setName('server')
    .setDescription('معلومات السيرفر'),

  new SlashCommandBuilder()
    .setName('setrole')
    .setDescription('السماح لرول باستخدام أوامر البوت')
    .addRoleOption(o =>
      o.setName('role')
        .setDescription('الرول')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('unsetrole')
    .setDescription('إزالة صلاحية رول')
    .addRoleOption(o =>
      o.setName('role')
        .setDescription('الرول')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('bc')
    .setDescription('برودكاست خاص لجميع الأعضاء')
    .addStringOption(o =>
      o.setName('title')
        .setDescription('عنوان الإعلان')
        .setRequired(true))
    .addStringOption(o =>
      o.setName('message')
        .setDescription('نص الإعلان')
        .setRequired(true))
    .addStringOption(o =>
      o.setName('color')
        .setDescription('لون مثل #5865F2')
        .setRequired(false))
    .addStringOption(o =>
      o.setName('image')
        .setDescription('رابط الصورة')
        .setRequired(false))
    .addStringOption(o =>
      o.setName('link')
        .setDescription('رابط الإعلان')
        .setRequired(false)),

  new SlashCommandBuilder()
    .setName('bcrole')
    .setDescription('برودكاست خاص لرول محدد')
    .addRoleOption(o =>
      o.setName('role')
        .setDescription('الرول المستهدف')
        .setRequired(true))
    .addStringOption(o =>
      o.setName('title')
        .setDescription('عنوان الإعلان')
        .setRequired(true))
    .addStringOption(o =>
      o.setName('message')
        .setDescription('نص الإعلان')
        .setRequired(true))
    .addStringOption(o =>
      o.setName('color')
        .setDescription('لون مثل #5865F2')
        .setRequired(false))
    .addStringOption(o =>
      o.setName('image')
        .setDescription('رابط الصورة')
        .setRequired(false))
    .addStringOption(o =>
      o.setName('link')
        .setDescription('رابط الإعلان')
        .setRequired(false)),

  new SlashCommandBuilder()
    .setName('lock')
    .setDescription('قفل الروم')
    .addChannelOption(o =>
      o.setName('channel')
        .setDescription('الروم المراد قفله، اختياري')
        .addChannelTypes(ChannelType.GuildText))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('فتح الروم')
    .addChannelOption(o =>
      o.setName('channel')
        .setDescription('الروم المراد فتحه، اختياري')
        .addChannelTypes(ChannelType.GuildText))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('حذف رسائل')
    .addIntegerOption(o =>
      o.setName('amount')
        .setDescription('عدد الرسائل من 1 إلى 100')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('طرد عضو')
    .addUserOption(o =>
      o.setName('member')
        .setDescription('العضو')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('حظر عضو')
    .addUserOption(o =>
      o.setName('member')
        .setDescription('العضو')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('إسكات عضو مؤقتاً')
    .addUserOption(o =>
      o.setName('member')
        .setDescription('العضو')
        .setRequired(true))
    .addIntegerOption(o =>
      o.setName('minutes')
        .setDescription('المدة بالدقائق')
        .setMinValue(1)
        .setMaxValue(40320)
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName('role')
    .setDescription('إعطاء رول لعضو')
    .addUserOption(o =>
      o.setName('member')
        .setDescription('العضو')
        .setRequired(true))
    .addRoleOption(o =>
      o.setName('role')
        .setDescription('الرول')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  new SlashCommandBuilder()
    .setName('removerole')
    .setDescription('إزالة رول من عضو')
    .addUserOption(o =>
      o.setName('member')
        .setDescription('العضو')
        .setRequired(true))
    .addRoleOption(o =>
      o.setName('role')
        .setDescription('الرول')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
].map(command => command.toJSON());

function isAdmin(interaction) {
  return interaction.memberPermissions?.has(
    PermissionFlagsBits.Administrator
  ) ?? false;
}

function canUseBroadcast(interaction) {
  if (isAdmin(interaction)) return true;

  const allowed = config.allowedRoles[interaction.guildId] || [];
  const memberRoles = interaction.member.roles.cache;

  return allowed.some(roleId => memberRoles.has(roleId));
}

function getUrl(value) {
  if (!value) return null;

  try {
    const url = new URL(value);

    if (url.protocol === 'https:' || url.protocol === 'http:') {
      return url.toString();
    }
  } catch {}

  return null;
}

function makeEmbed(interaction, title, message, color, image, link) {
  let embedColor = 0x5865F2;

  if (color) {
    const hex = color.replace('#', '').trim();

    if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
      throw new Error('اللون غير صحيح. مثال: #5865F2');
    }

    embedColor = parseInt(hex, 16);
  }

  if (image && !getUrl(image)) {
    throw new Error('رابط الصورة غير صحيح.');
  }

  if (link && !getUrl(link)) {
    throw new Error('الرابط غير صحيح.');
  }

  const embed = new EmbedBuilder()
    .setColor(embedColor)
    .setTitle(title)
    .setDescription(message)
    .setFooter({
      text: `${BOT_NAME} • ${interaction.guild.name}`
    })
    .setTimestamp();

  if (image) {
    embed.setImage(getUrl(image));
  }

  if (link) {
    embed.addFields({
      name: 'الرابط',
      value: `[اضغط هنا لفتح الرابط](${getUrl(link)})`
    });
  }

  return embed;
}

async function broadcast(interaction, targetRole, embed) {
  await interaction.deferReply({ ephemeral: true });

  let members;

  try {
    members = await interaction.guild.members.fetch();
  } catch {
    return interaction.editReply(
      'تعذر جلب الأعضاء. تأكد من تفعيل Server Members Intent.'
    );
  }

  const targets = [...members.values()].filter(member =>
    !member.user.bot &&
    (!targetRole || member.roles.cache.has(targetRole.id))
  );

  let sent = 0;
  let failed = 0;

  await interaction.editReply(
    `بدأ الإرسال إلى ${targets.length} عضو. انتظر حتى يكتمل التقرير.`
  );

  for (const member of targets) {
    try {
      await member.send({
        embeds: [embed],
        allowedMentions: { parse: [] }
      });

      sent++;
    } catch {
      failed++;
    }

    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  await interaction.editReply(
    `**انتهى البرودكاست**\n` +
    `✅ نجح الإرسال: ${sent}\n` +
    `❌ تعذر الإرسال: ${failed}\n` +
    `👥 عدد المستهدفين: ${targets.length}`
  );
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  client.user.setActivity('Blor System');

  try {
    const rest = new REST({ version: '10' }).setToken(TOKEN);

    const route = GUILD_ID
      ? Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID)
      : Routes.applicationCommands(CLIENT_ID);

    await rest.put(route, { body: commands });

    console.log('Slash commands registered successfully.');
  } catch (error) {
    console.error('Command registration error:', error.message);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (!interaction.guild) return;

  const name = interaction.commandName;

  try {
    if (name === 'help') {
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('Blor System • الأوامر')
        .setDescription(
          '**عام:** `/ping` `/server` `/help`\n' +
          '**برودكاست:** `/bc` `/bcrole`\n' +
          '**صلاحيات:** `/setrole` `/unsetrole`\n' +
          '**رومات:** `/lock` `/unlock`\n' +
          '**إدارة:** `/ban` `/kick` `/timeout` `/clear`\n' +
          '**رولات:** `/role` `/removerole`'
        );

      return interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
    }

    if (name === 'ping') {
      return interaction.reply({
        content: `🏓 Ping: ${client.ws.ping}ms`,
        ephemeral: true
      });
    }

    if (name === 'server') {
      const guild = interaction.guild;

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(guild.name);

      const icon = guild.iconURL();

      if (icon) embed.setThumbnail(icon);

      embed.addFields(
        {
          name: 'الأعضاء',
          value: `${guild.memberCount}`,
          inline: true
        },
        {
          name: 'معرّف السيرفر',
          value: guild.id
        }
      );

      return interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
    }

    if (name === 'setrole' || name === 'unsetrole') {
      if (!isAdmin(interaction)) {
        return interaction.reply({
          content: 'هذا الأمر للمسؤولين فقط.',
          ephemeral: true
        });
      }

      const role = interaction.options.getRole('role');

      const roles = new Set(
        config.allowedRoles[interaction.guildId] || []
      );

      if (name === 'setrole') {
        roles.add(role.id);
      } else {
        roles.delete(role.id);
      }

      config.allowedRoles[interaction.guildId] = [...roles];
      saveConfig();

      return interaction.reply({
        content: name === 'setrole'
          ? `تم السماح للرول ${role} باستخدام البرودكاست.`
          : `تمت إزالة صلاحية الرول ${role}.`,
        ephemeral: true
      });
    }

    if (name === 'bc' || name === 'bcrole') {
      if (!canUseBroadcast(interaction)) {
        return interaction.reply({
          content: 'ليس لديك صلاحية البرودكاست. اطلب من مسؤول السيرفر ضبط الرولات.',
          ephemeral: true
        });
      }

      const targetRole = name === 'bcrole'
        ? interaction.options.getRole('role')
        : null;

      let embed;

      try {
        embed = makeEmbed(
          interaction,
          interaction.options.getString('title'),
          interaction.options.getString('message'),
          interaction.options.getString('color'),
          interaction.options.getString('image'),
          interaction.options.getString('link')
        );
      } catch (error) {
        return interaction.reply({
          content: error.message,
          ephemeral: true
        });
      }

      return broadcast(interaction, targetRole, embed);
    }

    if (name === 'lock' || name === 'unlock') {
      if (!interaction.memberPermissions?.has(
        PermissionFlagsBits.ManageChannels
      )) {
        return interaction.reply({
          content: 'تحتاج صلاحية إدارة القنوات.',
          ephemeral: true
        });
      }

      const lock = name === 'lock';

      const channel =
        interaction.options.getChannel('channel') ||
        interaction.channel;

      if (
        !channel ||
        !channel.permissionOverwrites ||
        !channel.isTextBased()
      ) {
        return interaction.reply({
          content: 'هذا الروم لا يدعم تعديل الصلاحيات.',
          ephemeral: true
        });
      }

      await channel.permissionOverwrites.edit(
        interaction.guild.roles.everyone,
        {
          SendMessages: lock ? false : null,
          AddReactions: lock ? false : null
        },
        {
          reason: `${lock ? 'Lock' : 'Unlock'} by ${interaction.user.tag}`
        }
      );

      return interaction.reply({
        content: lock
          ? `🔒 تم قفل ${channel}.`
          : `🔓 تم فتح ${channel}.`,
        ephemeral: false
      });
    }

    if (name === 'clear') {
      if (!interaction.memberPermissions?.has(
        PermissionFlagsBits.ManageMessages
      )) {
        return interaction.reply({
          content: 'تحتاج صلاحية إدارة الرسائل.',
          ephemeral: true
        });
      }

      const amount = interaction.options.getInteger('amount');

      const deleted = await interaction.channel.bulkDelete(
        amount,
        true
      );

      return interaction.reply({
        content: `تم حذف ${deleted.size} رسالة.`,
        ephemeral: true
      });
    }

    if (name === 'kick' || name === 'ban' || name === 'timeout') {
      const user = interaction.options.getUser('member');

      const member = await interaction.guild.members.fetch(user.id)
        .catch(() => null);

      if (!member) {
        return interaction.reply({
          content: 'العضو غير موجود في السيرفر.',
          ephemeral: true
        });
      }

      if (member.id === interaction.user.id) {
        return interaction.reply({
          content: 'لا يمكنك استخدام الأمر على نفسك.',
          ephemeral: true
        });
      }

      if (name === 'kick') {
        if (!interaction.memberPermissions?.has(
          PermissionFlagsBits.KickMembers
        )) {
          return interaction.reply({
            content: 'تحتاج صلاحية طرد الأعضاء.',
            ephemeral: true
          });
        }

        if (!member.kickable) {
          return interaction.reply({
            content: 'لا يستطيع البوت طرد هذا العضو. تحقق من ترتيب الرتب.',
            ephemeral: true
          });
        }

        await member.kick(`By ${interaction.user.tag}`);

        return interaction.reply({
          content: `تم طرد ${user.tag}.`,
          ephemeral: true
        });
      }

      if (name === 'ban') {
        if (!interaction.memberPermissions?.has(
          PermissionFlagsBits.BanMembers
        )) {
          return interaction.reply({
            content: 'تحتاج صلاحية حظر الأعضاء.',
            ephemeral: true
          });
        }

        if (!member.bannable) {
          return interaction.reply({
            content: 'لا يستطيع البوت حظر هذا العضو. تحقق من ترتيب الرتب.',
            ephemeral: true
          });
        }

        await member.ban({
          reason: `By ${interaction.user.tag}`
        });

        return interaction.reply({
          content: `تم حظر ${user.tag}.`,
          ephemeral: true
        });
      }

      if (!interaction.memberPermissions?.has(
        PermissionFlagsBits.ModerateMembers
      )) {
        return interaction.reply({
          content: 'تحتاج صلاحية إسكات الأعضاء.',
          ephemeral: true
        });
      }

      const minutes = interaction.options.getInteger('minutes');

      if (!member.moderatable) {
        return interaction.reply({
          content: 'لا يستطيع البوت إسكات هذا العضو. تحقق من ترتيب الرتب.',
          ephemeral: true
        });
      }

      await member.timeout(
        minutes * 60 * 1000,
        `By ${interaction.user.tag}`
      );

      return interaction.reply({
        content: `تم إسكات ${user.tag} لمدة ${minutes} دقيقة.`,
        ephemeral: true
      });
    }

    if (name === 'role' || name === 'removerole') {
      if (!interaction.memberPermissions?.has(
        PermissionFlagsBits.ManageRoles
      )) {
        return interaction.reply({
          content: 'تحتاج صلاحية إدارة الرتب.',
          ephemeral: true
        });
      }

      const user = interaction.options.getUser('member');
      const role = interaction.options.getRole('role');

      const member = await interaction.guild.members.fetch(user.id)
        .catch(() => null);

      if (!member) {
        return interaction.reply({
          content: 'العضو غير موجود في السيرفر.',
          ephemeral: true
        });
      }

      const botMember = interaction.guild.members.me;

      if (
        role.managed ||
        role.position >= botMember.roles.highest.position
      ) {
        return interaction.reply({
          content: 'ارفع رتبة البوت فوق الرول المطلوب.',
          ephemeral: true
        });
      }

      if (name === 'role') {
        await member.roles.add(role);
      } else {
        await member.roles.remove(role);
      }

      return interaction.reply({
        content: name === 'role'
          ? `تم إعطاء ${user} الرول ${role}.`
          : `تمت إزالة الرول ${role} من ${user}.`,
        ephemeral: true
      });
    }
  } catch (error) {
    console.error(`Error in /${name}:`, error);

    const message =
      'حدث خطأ. تحقق من صلاحيات البوت وترتيب الرتب.';

    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({
        content: message,
        ephemeral: true
      }).catch(() => {});
    } else {
      await interaction.reply({
        content: message,
        ephemeral: true
      }).catch(() => {});
    }
  }
});

client.on('error', error => {
  console.error('Discord error:', error);
});

function textCommandName(key) {
  return config.textCommands?.[key] ||
    DEFAULT_TEXT_COMMANDS[key] ||
    key;
}

function textUsage() {
  const p = config.prefix || '!';

  return [
    `**البادئة الحالية:** \`${p}\``,
    `\`${p}${textCommandName('help')}\` — عرض الأوامر`,
    `\`${p}${textCommandName('lock')} [#روم]\` — قفل روم`,
    `\`${p}${textCommandName('unlock')} [#روم]\` — فتح روم`,
    `\`${p}${textCommandName('clear')} عدد\` — حذف رسائل`,
    `\`${p}${textCommandName('ping')}\` — سرعة البوت`,
    `\`${p}${textCommandName('server')}\` — معلومات السيرفر`,
    `\`${p}${textCommandName('setprefix')} رمز\` — تغيير البادئة`,
    `\`${p}${textCommandName('setcmd')} الأمر الاسم\` — تغيير اسم أمر نصي`
  ].join('\n');
}

client.on('messageCreate', async message => {
  if (!message.guild || message.author.bot) return;

  const prefix = config.prefix || '!';

  if (!message.content.startsWith(prefix)) return;

  const parts = message.content
    .slice(prefix.length)
    .trim()
    .split(/\s+/);

  const entered = (parts.shift() || '').toLowerCase();
  const args = parts;

  const key = Object.keys(config.textCommands || {}).find(
    k => String(config.textCommands[k]).toLowerCase() === entered
  );

  if (!key) return;

  const member = message.member;

  if (!member) return;

  const isAdminText = member.permissions.has(
    PermissionFlagsBits.Administrator
  );

  const canManageChannels = member.permissions.has(
    PermissionFlagsBits.ManageChannels
  );

  const canManageMessages = member.permissions.has(
    PermissionFlagsBits.ManageMessages
  );

  try {
    if (key === 'help') {
      return message.reply(textUsage());
    }

    if (key === 'ping') {
      return message.reply(`🏓 Ping: ${client.ws.ping}ms`);
    }

    if (key === 'server') {
      return message.reply(
        `**${message.guild.name}**\n` +
        `الأعضاء: ${message.guild.memberCount}\n` +
        `معرّف السيرفر: ${message.guild.id}`
      );
    }

    if (key === 'setprefix') {
      if (!isAdminText) {
        return message.reply('هذا الأمر للمسؤولين فقط.');
      }

      const newPrefix = args[0];

      if (
        !newPrefix ||
        newPrefix.length > 5 ||
        /\s/.test(newPrefix)
      ) {
        return message.reply(
          'اكتب بادئة من 1 إلى 5 أحرف، مثال: `!setprefix ?`'
        );
      }

      config.prefix = newPrefix;
      saveConfig();

      return message.reply(
        `تم تغيير البادئة إلى \`${newPrefix}\``
      );
    }

    if (key === 'setcmd') {
      if (!isAdminText) {
        return message.reply('هذا الأمر للمسؤولين فقط.');
      }

      const commandKey = (args[0] || '').toLowerCase();
      const newName = (args[1] || '').toLowerCase();

      if (
        !Object.prototype.hasOwnProperty.call(
          DEFAULT_TEXT_COMMANDS,
          commandKey
        ) ||
        !newName ||
        !/^[\p{L}\p{N}_-]{1,25}$/u.test(newName)
      ) {
        return message.reply(
          'الاستخدام: `!setcmd lock قفل`\n' +
          'اكتب المفتاح الأصلي للأمر ثم الاسم الجديد.\n' +
          'الأوامر المتاحة: ' +
          Object.keys(DEFAULT_TEXT_COMMANDS).join(', ')
        );
      }

      const duplicate = Object.entries(config.textCommands).some(
        ([k, v]) =>
          k !== commandKey &&
          String(v).toLowerCase() === newName
      );

      if (duplicate) {
        return message.reply('هذا الاسم مستخدم لأمر آخر.');
      }

      config.textCommands[commandKey] = newName;
      saveConfig();

      return message.reply(
        `تم تغيير اسم الأمر النصي **${commandKey}** إلى \`${newName}\``
      );
    }

    if (key === 'lock' || key === 'unlock') {
      if (!canManageChannels) {
        return message.reply('تحتاج صلاحية إدارة القنوات.');
      }

      const channel =
        message.mentions.channels.first() ||
        message.guild.channels.cache.get(args[0]) ||
        message.channel;

      if (
        !channel ||
        !channel.permissionOverwrites ||
        !channel.isTextBased()
      ) {
        return message.reply('حدد رومًا نصيًا صالحًا.');
      }

      const lock = key === 'lock';

      await channel.permissionOverwrites.edit(
        message.guild.roles.everyone,
        {
          SendMessages: lock ? false : null,
          AddReactions: lock ? false : null
        },
        {
          reason: `${lock ? 'Lock' : 'Unlock'} by ${message.author.tag}`
        }
      );

      return message.reply(
        lock
          ? `🔒 تم قفل ${channel}.`
          : `🔓 تم فتح ${channel}.`
      );
    }

    if (key === 'clear') {
      if (!canManageMessages) {
        return message.reply('تحتاج صلاحية إدارة الرسائل.');
      }

      const amount = Number(args[0]);

      if (
        !Number.isInteger(amount) ||
        amount < 1 ||
        amount > 100
      ) {
        return message.reply('اكتب عددًا من 1 إلى 100.');
      }

      const deleted = await message.channel.bulkDelete(
        amount,
        true
      );

      const notice = await message.channel.send(
        `تم حذف ${deleted.size} رسالة.`
      );

      setTimeout(() => {
        notice.delete().catch(() => {});
      }, 4000);

      return;
    }

    if (key === 'kick' || key === 'ban' || key === 'timeout') {
      const needed =
        key === 'kick'
          ? PermissionFlagsBits.KickMembers
          : key === 'ban'
            ? PermissionFlagsBits.BanMembers
            : PermissionFlagsBits.ModerateMembers;

      if (!member.permissions.has(needed)) {
        return message.reply(
          'ما عندك صلاحية استخدام هذا الأمر.'
        );
      }

      const target =
        message.mentions.members.first() ||
        (
          args[0]
            ? await message.guild.members.fetch(args[0])
                .catch(() => null)
            : null
        );

      if (!target) {
        return message.reply('منشن العضو أو اكتب معرّفه.');
      }

      if (target.id === message.author.id) {
        return message.reply(
          'ما تقدر تستخدم الأمر على نفسك.'
        );
      }

      if (key === 'kick') {
        if (!target.kickable) {
          return message.reply(
            'ما أقدر أطرد العضو؛ تحقق من ترتيب الرتب.'
          );
        }

        await target.kick(`By ${message.author.tag}`);

        return message.reply(
          `تم طرد ${target.user.tag}.`
        );
      }

      if (key === 'ban') {
        if (!target.bannable) {
          return message.reply(
            'ما أقدر أحظر العضو؛ تحقق من ترتيب الرتب.'
          );
        }

        await target.ban({
          reason: `By ${message.author.tag}`
        });

        return message.reply(
          `تم حظر ${target.user.tag}.`
        );
      }

      const minutes = Number(args[1]);

      if (
        !Number.isInteger(minutes) ||
        minutes < 1 ||
        minutes > 40320
      ) {
        return message.reply(
          'الاستخدام: الأمر ثم منشن العضو ثم المدة بالدقائق (1–40320).'
        );
      }

      if (!target.moderatable) {
        return message.reply(
          'ما أقدر أسكت العضو؛ تحقق من ترتيب الرتب.'
        );
      }

      await target.timeout(
        minutes * 60 * 1000,
        `By ${message.author.tag}`
      );

      return message.reply(
        `تم إسكات ${target.user.tag} لمدة ${minutes} دقيقة.`
      );
    }

    if (key === 'role' || key === 'removerole') {
      if (!member.permissions.has(
        PermissionFlagsBits.ManageRoles
      )) {
        return message.reply('تحتاج صلاحية إدارة الرتب.');
      }

      const target = message.mentions.members.first();

      const role =
        message.mentions.roles.first() ||
        message.guild.roles.cache.get(args[1]);

      if (!target || !role) {
        return message.reply(
          'الاستخدام: الأمر ثم منشن العضو ثم منشن الرول.'
        );
      }

      const botMember = message.guild.members.me;

      if (
        role.managed ||
        role.position >= botMember.roles.highest.position
      ) {
        return message.reply(
          'ارفع رتبة البوت فوق الرول المطلوب.'
        );
      }

      if (key === 'role') {
        await target.roles.add(role);
      } else {
        await target.roles.remove(role);
      }

      return message.reply(
        key === 'role'
          ? `تم إعطاء ${role} إلى ${target}.`
          : `تمت إزالة ${role} من ${target}.`
      );
    }

    if (key === 'bc' || key === 'bcrole') {
      return message.reply(
        'أوامر البرودكاست النصية غير مضافة في هذه النسخة؛ استخدم /bc أو /bcrole.'
      );
    }
  } catch (error) {
    console.error(
      `Text command ${entered} error:`,
      error
    );

    return message.reply(
      'حدث خطأ. تأكد من صلاحيات البوت وترتيب الرتب.'
    ).catch(() => {});
  }
});

client.login(TOKEN);
