
const {
  Client,
  GatewayIntentBits,
  PermissionFlagsBits,
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

let config = { allowedRoles: {} };

try {
  if (fs.existsSync(CONFIG_FILE)) {
    config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    if (!config.allowedRoles) config.allowedRoles = {};
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
    GatewayIntentBits.GuildMembers
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
      o.setName('role').setDescription('الرول').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('unsetrole')
    .setDescription('إزالة صلاحية رول')
    .addRoleOption(o =>
      o.setName('role').setDescription('الرول').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('bc')
    .setDescription('برودكاست خاص لجميع الأعضاء')
    .addStringOption(o =>
      o.setName('title').setDescription('عنوان الإعلان').setRequired(true))
    .addStringOption(o =>
      o.setName('message').setDescription('نص الإعلان').setRequired(true))
    .addStringOption(o =>
      o.setName('color').setDescription('لون مثل #5865F2').setRequired(false))
    .addStringOption(o =>
      o.setName('image').setDescription('رابط الصورة').setRequired(false))
    .addStringOption(o =>
      o.setName('link').setDescription('رابط الإعلان').setRequired(false)),

  new SlashCommandBuilder()
    .setName('bcrole')
    .setDescription('برودكاست خاص لرول محدد')
    .addRoleOption(o =>
      o.setName('role').setDescription('الرول المستهدف').setRequired(true))
    .addStringOption(o =>
      o.setName('title').setDescription('عنوان الإعلان').setRequired(true))
    .addStringOption(o =>
      o.setName('message').setDescription('نص الإعلان').setRequired(true))
    .addStringOption(o =>
      o.setName('color').setDescription('لون مثل #5865F2').setRequired(false))
    .addStringOption(o =>
      o.setName('image').setDescription('رابط الصورة').setRequired(false))
    .addStringOption(o =>
      o.setName('link').setDescription('رابط الإعلان').setRequired(false)),

  new SlashCommandBuilder()
    .setName('lock')
    .setDescription('قفل الروم')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('فتح الروم')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('حذف رسائل')
    .addIntegerOption(o =>
      o.setName('amount')
        .setDescription('عدد الرسائل من 1 إلى 100')
        .setMinValue(1).setMaxValue(100).setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('طرد عضو')
    .addUserOption(o =>
      o.setName('member').setDescription('العضو').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('حظر عضو')
    .addUserOption(o =>
      o.setName('member').setDescription('العضو').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('إسكات عضو مؤقتاً')
    .addUserOption(o =>
      o.setName('member').setDescription('العضو').setRequired(true))
    .addIntegerOption(o =>
      o.setName('minutes').setDescription('المدة بالدقائق')
        .setMinValue(1).setMaxValue(40320).setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName('role')
    .setDescription('إعطاء رول لعضو')
    .addUserOption(o =>
      o.setName('member').setDescription('العضو').setRequired(true))
    .addRoleOption(o =>
      o.setName('role').setDescription('الرول').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  new SlashCommandBuilder()
    .setName('removerole')
    .setDescription('إزالة رول من عضو')
    .addUserOption(o =>
      o.setName('member').setDescription('العضو').setRequired(true))
    .addRoleOption(o =>
      o.setName('role').setDescription('الرول').setRequired(true))
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

  if (image) embed.setImage(getUrl(image));

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

    // تأخير بين الرسائل وعدم محاولة تجاوز حدود Discord.
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

      return interaction.reply({ embeds: [embed], ephemeral: true });
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
        .setTitle(guild.name)
        .setThumbnail(guild.iconURL())
        .addFields(
          { name: 'الأعضاء', value: `${guild.memberCount}`, inline: true },
          { name: 'معرّف السيرفر', value: guild.id }
        );

      return interaction.reply({ embeds: [embed], ephemeral: true });
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

      if (name === 'setrole') roles.add(role.id);
      else roles.delete(role.id);

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
      if (!interaction.memberPermissions.has(
        PermissionFlagsBits.ManageChannels
      )) {
        return interaction.reply({
          content: 'تحتاج صلاحية Manage Channels.',
          ephemeral: true
        });
      }

      const lock = name === 'lock';

      await interaction.channel.permissionOverwrites.edit(
        interaction.guild.roles.everyone,
        {
          SendMessages: lock ? false : null,
          AddReactions: lock ? false : null
        }
      );

      return interaction.reply(
        lock ? '🔒 تم قفل الروم.' : '🔓 تم فتح الروم.'
      );
    }

    if (name === 'clear') {
      const amount = interaction.options.getInteger('amount');
      const deleted = await interaction.channel.bulkDelete(amount, true);

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
        if (!member.bannable) {
          return interaction.reply({
            content: 'لا يستطيع البوت حظر هذا العضو. تحقق من ترتيب الرتب.',
            ephemeral: true
          });
        }

        await member.ban({ reason: `By ${interaction.user.tag}` });

        return interaction.reply({
          content: `تم حظر ${user.tag}.`,
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

      if (name === 'role') await member.roles.add(role);
      else await member.roles.remove(role);

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

client.on('error', error => console.error('Discord error:', error));

client.login(TOKEN);
