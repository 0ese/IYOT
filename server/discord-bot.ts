import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, AttachmentBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';

const execAsync = promisify(exec);

// ===== DISCORD CREDENTIALS (from environment variables) =====
const DISCORD_TOKEN = process.env.DISCORD_TOKEN || '';
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '';

console.log('🔍 Checking Discord credentials...');
console.log('DISCORD_TOKEN set:', DISCORD_TOKEN ? 'YES ✅' : 'NO ❌');
console.log('DISCORD_CLIENT_ID set:', DISCORD_CLIENT_ID ? 'YES ✅' : 'NO ❌');

if (!DISCORD_TOKEN) {
  console.error('');
  console.error('❌ FATAL ERROR: DISCORD_TOKEN is not set!');
  console.error('');
  console.error('SOLUTION:');
  console.error('1. Go to Render dashboard');
  console.error('2. Select your web service');
  console.error('3. Go to "Environment" tab');
  console.error('4. Add variable: DISCORD_TOKEN = (your bot token)');
  console.error('');
  console.error('Get token from: https://discord.com/developers/applications');
  console.error('');
  process.exit(1);
}

if (!DISCORD_CLIENT_ID) {
  console.error('');
  console.error('❌ FATAL ERROR: DISCORD_CLIENT_ID is not set!');
  console.error('');
  console.error('SOLUTION:');
  console.error('1. Go to Render dashboard');
  console.error('2. Select your web service');
  console.error('3. Go to "Environment" tab');
  console.error('4. Add variable: DISCORD_CLIENT_ID = (your app ID)');
  console.error('');
  console.error('Get app ID from: https://discord.com/developers/applications');
  console.error('');
  process.exit(1);
}

if (!DISCORD_TOKEN.startsWith('M') || DISCORD_TOKEN.length < 50) {
  console.error('');
  console.error('❌ WARNING: DISCORD_TOKEN looks invalid!');
  console.error('Valid token should start with "M" and be ~100+ characters long');
  console.error('Current token:', DISCORD_TOKEN.substring(0, 20) + '...');
  console.error('');
}

const DEOBFUSCATOR_PATH = path.join(process.cwd(), 'attached_assets/MoonsecDeobfuscator-master/bin/Release/net8.0/MoonsecDeobfuscator');
const TEMP_DIR = path.join(process.cwd(), 'temp');

// Gift role - admins can gift tokens
const GIFT_ROLE = '1441821570266955858';

// ===== IN-MEMORY TOKEN STORAGE ONLY =====
const memoryTokens = new Map<string, { tokens: number; lastDailyClaim: number }>();

// Get or create user tokens
function getUserTokens(userId: string): number {
  if (!memoryTokens.has(userId)) {
    memoryTokens.set(userId, { tokens: 3, lastDailyClaim: 0 });
  }
  return memoryTokens.get(userId)!.tokens;
}

// Deduct tokens
function deductTokens(userId: string): boolean {
  const currentTokens = getUserTokens(userId);
  
  if (currentTokens < 1) {
    return false;
  }
  
  const data = memoryTokens.get(userId)!;
  data.tokens -= 1;
  memoryTokens.set(userId, data);
  
  return true;
}

// Check and add daily tokens (2 tokens per 24 hours)
function claimDailyTokens(userId: string): void {
  if (!memoryTokens.has(userId)) {
    memoryTokens.set(userId, { tokens: 3, lastDailyClaim: 0 });
    return;
  }
  
  const data = memoryTokens.get(userId)!;
  const now = Date.now();
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  
  if (now - data.lastDailyClaim >= TWENTY_FOUR_HOURS) {
    data.tokens += 2;
    data.lastDailyClaim = now;
    memoryTokens.set(userId, data);
  }
}

// Add tokens (for /gift command)
function addTokens(userId: string, amount: number): boolean {
  const currentTokens = getUserTokens(userId);
  const data = memoryTokens.get(userId)!;
  data.tokens += amount;
  memoryTokens.set(userId, data);
  return true;
}

// Ensure temp directory exists
async function ensureTempDir() {
  try {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating temp directory:', error);
  }
}

// Register slash commands globally
export async function registerCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName('deobf')
      .setDescription('Deobfuscate a Moonsec obfuscated Lua file')
      .addAttachmentOption(option =>
        option
          .setName('file')
          .setDescription('The Moonsec obfuscated Lua file to deobfuscate')
          .setRequired(true)
      )
      .toJSON(),
    new SlashCommandBuilder()
      .setName('gift')
      .setDescription('Gift tokens to a member')
      .addUserOption(option =>
        option
          .setName('member')
          .setDescription('The member to gift tokens to')
          .setRequired(true)
      )
      .addIntegerOption(option =>
        option
          .setName('amount')
          .setDescription('Number of tokens to gift')
          .setRequired(true)
          .setMinValue(1)
      )
      .toJSON(),
  ];

  const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

  try {
    console.log('Registering global slash commands...');
    await rest.put(Routes.applicationCommands(DISCORD_CLIENT_ID), { body: commands });
    console.log('✅ Global slash commands registered successfully!');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
}

// Extract HTTP/HTTPS links from content
function extractLinks(content: Buffer | string): string[] {
  const text = typeof content === 'string' ? content : content.toString('utf-8', 0, Math.min(content.length, 1000000));
  
  const urlRegex = /https?:\/\/[a-zA-Z0-9\-._~:/?#@!$&'*+,;=%]+/g;
  const matches = text.match(urlRegex) || [];
  
  const cleanedUrls = matches.map(url => {
    return url.replace(/[.,;:!?%]+$/, '');
  });
  
  return Array.from(new Set(cleanedUrls));
}

// Download file from Discord
async function downloadFile(url: string, outputPath: string): Promise<void> {
  const response = await axios({
    method: 'GET',
    url: url,
    responseType: 'arraybuffer',
  });
  await fs.writeFile(outputPath, response.data);
}

// Sanitize filename to prevent path traversal
function sanitizeFilename(filename: string): string {
  const basename = path.basename(filename);
  return basename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

// Deobfuscate file using the C# tool
async function deobfuscateFile(inputPath: string, outputPath: string): Promise<{ stdout: string; stderr: string }> {
  // Try .NET 8.0 runtime
  let command = `dotnet ${DEOBFUSCATOR_PATH}.dll -dev -i "${inputPath}" -o "${outputPath}"`;
  
  try {
    const { stdout, stderr } = await execAsync(command);
    return { stdout, stderr };
  } catch (error: any) {
    const errorMsg = error.stderr || error.message;
    
    if (errorMsg.includes('dotnet: not found')) {
      console.error('⚠️  .NET 8.0 runtime not found on this system');
      console.error('Please ensure .NET 8.0 is installed on your Render instance');
      throw new Error('dotnet runtime not available');
    }
    
    throw new Error(errorMsg);
  }
}

// Start the Discord bot
export async function startBot() {
  await ensureTempDir();
  await registerCommands();

  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
  });

  client.once('ready', () => {
    console.log(`✅ Discord bot logged in as ${client.user?.tag}`);
    console.log(`🤖 Bot is ready to deobfuscate Moonsec files!`);
    console.log(`💾 Using in-memory token storage`);
  });

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    // Gift command
    if (interaction.commandName === 'gift') {
      if (!interaction.member) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xF04747)
              .setTitle('❌ Access Denied')
              .setDescription('Unable to verify your roles.')
              .setFooter({ text: `Requested by ${interaction.user.tag}` })
              .setTimestamp()
          ],
          ephemeral: true,
        });
        return;
      }

      const userRoles = 'cache' in interaction.member.roles 
        ? interaction.member.roles.cache.map((r: any) => r.id) 
        : interaction.member.roles;
      
      if (!userRoles.includes(GIFT_ROLE)) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xF04747)
              .setTitle('❌ Access Denied')
              .setDescription('You do not have permission to gift tokens.')
              .setFooter({ text: `Requested by ${interaction.user.tag}` })
              .setTimestamp()
          ],
          ephemeral: true,
        });
        return;
      }

      const targetUser = interaction.options.getUser('member', true);
      const amount = interaction.options.getInteger('amount', true);

      try {
        addTokens(targetUser.id, amount);
        const newTokens = getUserTokens(targetUser.id);

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0x43B581)
              .setTitle('✅ Tokens Gifted')
              .setDescription(`Gifted **${amount}** tokens to ${targetUser.toString()}`)
              .addFields(
                { name: 'New Balance', value: `${newTokens} tokens`, inline: true }
              )
              .setFooter({ text: `Gifted by ${interaction.user.tag}` })
              .setTimestamp()
          ],
        });
        console.log(`[GIFT] ${interaction.user.tag} gifted ${amount} tokens to ${targetUser.tag}`);
      } catch (error) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xF04747)
              .setTitle('❌ Error')
              .setDescription('Failed to gift tokens.')
              .setFooter({ text: `Requested by ${interaction.user.tag}` })
              .setTimestamp()
          ],
          ephemeral: true,
        });
      }
      return;
    }

    // Deobf command
    if (interaction.commandName === 'deobf') {
      const startTime = Date.now();
      
      claimDailyTokens(interaction.user.id);
      
      const userTokens = getUserTokens(interaction.user.id);
      if (userTokens < 1) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xF04747)
              .setTitle('❌ Insufficient Tokens')
              .setDescription(`You have **0 tokens**. You get 2 free tokens every 24 hours. Come back tomorrow!`)
              .setFooter({ text: `Requested by ${interaction.user.tag}` })
              .setTimestamp()
          ],
          ephemeral: true,
        });
        return;
      }
      
      const attachment = interaction.options.getAttachment('file', true);
      
      if (!attachment) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xF04747)
              .setTitle('❌ Deobfuscation Failed')
              .setDescription('Please attach a Lua file to deobfuscate.\n\nUsage: `/deobf file:[your-file.lua]`')
              .setFooter({ text: `Requested by ${interaction.user.tag}` })
              .setTimestamp()
          ],
          ephemeral: true,
        });
        return;
      }

      const MAX_FILE_SIZE = 25 * 1024 * 1024;
      if (attachment.size > MAX_FILE_SIZE) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xF04747)
              .setTitle('❌ File Too Large')
              .setDescription(`File size: **${(attachment.size / 1024 / 1024).toFixed(2)} MB**\nMaximum allowed: **25 MB**\n\nPlease upload a smaller file.`)
              .setFooter({ text: `Requested by ${interaction.user.tag}` })
              .setTimestamp()
          ],
          ephemeral: true,
        });
        return;
      }

      const validExtensions = ['.lua', '.txt'];
      const fileExtension = path.extname(attachment.name).toLowerCase();
      if (!validExtensions.includes(fileExtension)) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xF04747)
              .setTitle('❌ Invalid File Type')
              .setDescription(`File type: **${fileExtension || 'unknown'}**\nAccepted types: **.lua, .txt**\n\nPlease upload a Lua or text file.`)
              .setFooter({ text: `Requested by ${interaction.user.tag}` })
              .setTimestamp()
          ],
          ephemeral: true,
        });
        return;
      }

      await interaction.deferReply();

      const processingEmbed = new EmbedBuilder()
        .setColor(0xFAA61A)
        .setTitle('⏳ Processing your file...')
        .setDescription(`File: **${attachment.name}**\nSize: **${(attachment.size / 1024).toFixed(2)} KB**`)
        .setFooter({ text: `Requested by ${interaction.user.tag}` })
        .setTimestamp();

      await interaction.editReply({ embeds: [processingEmbed] });

      const requestId = randomUUID();
      const sanitizedName = sanitizeFilename(attachment.name);
      const inputFilePath = path.join(TEMP_DIR, `input_${requestId}_${sanitizedName}`);
      const outputFilePath = path.join(TEMP_DIR, `output_${requestId}.lua`);

      console.log(`[${requestId}] Processing deobfuscation request for ${attachment.name} (${(attachment.size / 1024).toFixed(2)} KB)`);

      try {
        await downloadFile(attachment.url, inputFilePath);
        const originalSize = (await fs.stat(inputFilePath)).size;

        const { stdout, stderr } = await deobfuscateFile(inputFilePath, outputFilePath);
        
        if (stdout) console.log('Deobfuscator stdout:', stdout);
        if (stderr) console.log('Deobfuscator stderr:', stderr);

        const deobfuscatedContent = await fs.readFile(outputFilePath);
        const deobfuscatedSize = deobfuscatedContent.length;

        deductTokens(interaction.user.id);
        const remainingTokens = getUserTokens(interaction.user.id);

        const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);

        const resultAttachment = new AttachmentBuilder(deobfuscatedContent, {
          name: `deobfuscated_${sanitizedName.replace(/\.[^/.]+$/, '')}_${Date.now()}.lua`,
        });

        const decompileButton = new ButtonBuilder()
          .setLabel('Decompile The Output Code')
          .setURL('https://luadec.metaworm.site/')
          .setStyle(ButtonStyle.Link);

        const actionRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(decompileButton);

        const links = extractLinks(deobfuscatedContent);

        const successEmbed = new EmbedBuilder()
          .setColor(0x43B581)
          .setTitle('✅ Deobfuscation Complete')
          .setDescription(`Successfully deobfuscated **${attachment.name}**`)
          .addFields(
            { name: 'Original Size', value: `${(originalSize / 1024).toFixed(2)} KB`, inline: true },
            { name: 'Deobfuscated Size', value: `${(deobfuscatedSize / 1024).toFixed(2)} KB`, inline: true },
            { name: 'Processing Time', value: `${processingTime}s`, inline: true },
            { name: 'Tokens Left', value: `**${remainingTokens}** tokens`, inline: true }
          );

        if (links.length > 0) {
          successEmbed.addFields(
            { name: 'Found Links', value: links.join('\n'), inline: false }
          );
        }

        successEmbed
          .setFooter({ text: `Requested by ${interaction.user.tag}` })
          .setTimestamp();

        await interaction.editReply({ 
          embeds: [successEmbed],
          files: [resultAttachment],
          components: [actionRow],
        });

        console.log(`[${requestId}] Deobfuscation completed successfully in ${processingTime}s`);

      } catch (error) {
        console.error(`[${requestId}] Deobfuscation error:`, error);

        const errorEmbed = new EmbedBuilder()
          .setColor(0xF04747)
          .setTitle('❌ Deobfuscation Failed')
          .setDescription('⚠️ **Only Moonsec V3 supported**\n\nMake sure you\'re uploading a valid Moonsec V3 obfuscated file.')
          .setFooter({ text: `Requested by ${interaction.user.tag}` })
          .setTimestamp();

        await interaction.editReply({ embeds: [errorEmbed] });
      } finally {
        await fs.unlink(inputFilePath).catch(() => {});
        await fs.unlink(outputFilePath).catch(() => {});
      }
    }
  });

  client.login(DISCORD_TOKEN);
  
  return client;
}
