# Moonsec Discord Deobfuscator Bot - RENDER READY

Complete working Discord bot for Render deployment. No errors, no build issues.

## Folder Contents

```
FIX_BOT/
├── package.json                          (Dependencies - minimal setup)
├── .gitignore                            (Git ignore rules)
├── server/
│   ├── bot-only.ts                       (Entry point - runs on Render)
│   └── discord-bot.ts                    (Bot logic - slash commands)
└── attached_assets/                      (Deobfuscator binaries)
    ├── MoonsecDeobfuscator-master/       (C# deobfuscator)
    └── luadec51/                         (Lua decompiler)
```

## STEP 1: Get Discord Credentials

1. Go to https://discord.com/developers/applications
2. Click **"New Application"** → Name it **"Moonsec Bot"**
3. Go to **"Bot"** tab → Click **"Add Bot"**
4. Under **TOKEN** section, click **"Copy"** (save this - it's your `DISCORD_TOKEN`)
5. Go to **"General Information"** → Copy **"Application ID"** (this is your `DISCORD_CLIENT_ID`)

You now have:
- `DISCORD_TOKEN` = your bot token
- `DISCORD_CLIENT_ID` = your app ID

## STEP 2: Create GitHub Repository

1. Go to https://github.com/new
2. Name it: **moonsec-bot**
3. Make it **Public** or **Private** (your choice)
4. Click **"Create repository"**

You'll get a repository URL like:
```
https://github.com/YOUR_USERNAME/moonsec-bot.git
```

## STEP 3: Upload FIX_BOT to GitHub

In your terminal, run these commands:

```bash
# Navigate to FIX_BOT folder
cd FIX_BOT

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Moonsec Discord Bot - Ready for Render"

# Add remote (replace YOUR_USERNAME and moonsec-bot with yours)
git remote add origin https://github.com/YOUR_USERNAME/moonsec-bot.git

# Push to GitHub
git branch -M main
git push -u origin main
```

Your code is now on GitHub! ✅

## STEP 4: Deploy on Render

1. Go to https://render.com
2. Sign up with GitHub (click "Sign up with GitHub")
3. Click **"New"** → **"Web Service"**
4. Select your **moonsec-bot** repository
5. Configure:
   - **Name:** moonsec-bot
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

6. **Add Environment Variables:**
   - Key: `DISCORD_TOKEN` → Value: (your token from Step 1)
   - Key: `DISCORD_CLIENT_ID` → Value: (your App ID from Step 1)

7. Click **"Create Web Service"**

**Wait 2-3 minutes...** Your bot is now LIVE 24/7! ✅

## STEP 5: Invite Bot to Discord

1. Go to https://discord.com/developers/applications
2. Select your bot application
3. Go to **"OAuth2"** → **"URL Generator"**
4. Select:
   - Scopes: `bot`
   - Permissions: `Send Messages`, `Embed Links`, `Attach Files`
5. Copy the generated URL
6. Open URL in browser → Select server to invite bot
7. Click "Authorize"

**Done!** Your bot is now in your Discord server! 🎉

## STEP 6: Test the Bot

Type in Discord:
```
/deobf
```

Then attach a Moonsec V3 obfuscated Lua file.

Bot should respond with deobfuscated code! ✅

---

## What This Bot Does

- **`/deobf`** - Deobfuscate Moonsec V3 obfuscated Lua files
- **`/gift`** - Gift tokens to other users (admin only)
- **Token System** - 3 free tokens per user, +2 every 24 hours
- **Link Extraction** - Automatically finds links in deobfuscated code
- **Decompile Button** - Link to luadec for further decompilation

---

## Troubleshooting

**Bot not showing up in server?**
- Make sure you invited it (Step 5)
- Check Render dashboard to confirm it's running

**Commands not showing?**
- Wait 1-2 minutes for Discord to sync
- Try restarting bot from Render dashboard

**Bot crashed?**
- Check Render logs for errors
- Make sure DISCORD_TOKEN and DISCORD_CLIENT_ID are set correctly

---

**YOU'RE ALL SET! BOT RUNS 24/7 ON RENDER FOR FREE!** 🚀
