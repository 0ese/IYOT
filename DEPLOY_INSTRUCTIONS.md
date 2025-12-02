# Deploy to Render - .NET 8.0 Included

## The Fix

Added `Dockerfile` that automatically installs **.NET 8.0 runtime** before starting your bot.

---

## DEPLOY TO RENDER NOW

### STEP 1: Push to GitHub

```bash
cd FIX_BOT

git add .
git commit -m "Add Dockerfile - Install dotnet runtime for deobfuscation"
git push origin main
```

### STEP 2: Delete Old Render Service

1. Go to https://render.com dashboard
2. Click your **moonsec-bot** service
3. Go to **Settings** tab
4. Scroll to bottom → Click **"Delete Web Service"**
5. Type to confirm

### STEP 3: Create NEW Web Service with Dockerfile

1. Go to https://render.com dashboard
2. Click **"New +"** → **"Web Service"**
3. Select your **moonsec-bot** GitHub repo
4. Configure:
   - **Name:** `moonsec-bot`
   - **Runtime:** Select **"Docker"** (NOT Node)
   - **Build Command:** (leave blank - Dockerfile handles it)
   - **Start Command:** (leave blank - Dockerfile handles it)

5. **Environment Variables:** Add these:
   - Key: `DISCORD_TOKEN` → Value: (your bot token)
   - Key: `DISCORD_CLIENT_ID` → Value: (your app ID)

6. Click **"Create Web Service"**

**Wait 5-10 minutes** for Docker build to complete.

---

## Verify It Works

Check Render logs - should show:

```
=> Step 1/X : FROM node:20-bullseye
=> Step 2/X : RUN apt-get update...
...
=> RUN dotnet --version
  8.0.X [version number]
✅ dotnet version 8.0.X
npm start
🚀 Starting Moonsec Discord Bot...
✅ Global slash commands registered successfully!
✅ Discord bot logged in as Moonsec-DeobfV2#XXXX
🤖 Bot is ready to deobfuscate Moonsec files!
```

---

## Test in Discord

1. Go to your Discord server
2. Type `/deobf`
3. Attach a Moonsec V3 file
4. Bot should respond with **deobfuscated code** ✅

---

## What Dockerfile Does

```dockerfile
FROM node:20-bullseye
- Starts with Node.js 20

RUN apt-get update && apt-get install -y wget...
- Installs wget

RUN ./dotnet-install.sh --runtime dotnet --version 8.0
- Downloads and installs .NET 8.0 runtime

RUN npm install
- Installs Node dependencies

COPY server/ ./server/
COPY attached_assets/ ./attached_assets/
- Copies your bot code and deobfuscator

CMD ["npm", "start"]
- Runs: npm start
```

---

**THAT'S IT! Bot will have .NET 8.0 and deobfuscate properly!** 🚀
