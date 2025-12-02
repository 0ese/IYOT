# Environment Variables Setup

## What You Need

Your bot requires 2 environment variables to work on Render:

1. **DISCORD_TOKEN** - Your bot's authentication token
2. **DISCORD_CLIENT_ID** - Your application's client ID

## How to Get Them

### Step 1: Get DISCORD_TOKEN

1. Go to https://discord.com/developers/applications
2. Click on your application
3. Go to **"Bot"** tab (left sidebar)
4. Under "TOKEN" section, click **"Copy"**
5. This is your `DISCORD_TOKEN`

⚠️ **NEVER share this token!** It gives full access to your bot.

### Step 2: Get DISCORD_CLIENT_ID

1. Go to https://discord.com/developers/applications
2. Click on your application
3. Go to **"General Information"** tab (left sidebar)
4. Copy the **"Application ID"**
5. This is your `DISCORD_CLIENT_ID`

## How to Set Them in Render

1. Go to https://render.com dashboard
2. Select your **moonsec-bot** web service
3. Go to **"Environment"** tab
4. Click **"Add Environment Variable"**
5. Set:
   - **Key:** `DISCORD_TOKEN`
   - **Value:** (paste your token from Step 1)
6. Click **"Add Environment Variable"** again
7. Set:
   - **Key:** `DISCORD_CLIENT_ID`
   - **Value:** (paste your app ID from Step 2)
8. Render will **automatically redeploy** your bot

**Wait 2-3 minutes for the bot to restart with the new credentials.**

## Verify It's Working

1. Check Render logs - should say:
   ```
   🔍 Checking Discord credentials...
   DISCORD_TOKEN set: YES ✅
   DISCORD_CLIENT_ID set: YES ✅
   ✅ Global slash commands registered successfully!
   ```

2. If you see ✅ marks, your bot is **ONLINE**!

## If Still Getting Errors

**TokenInvalid error** means:
- Token is wrong/expired → Get a fresh token from Discord Developer Portal
- Token not set → Check Render Environment tab

**Unauthorized (401) error** means:
- Client ID is wrong → Copy correct ID from Discord Developer Portal
- Client ID not set → Check Render Environment tab

---

**Still stuck?** Follow these exactly:
1. Delete your old bot application on Discord
2. Create a NEW application
3. Add a NEW bot
4. Copy FRESH token and app ID
5. Update Render environment variables
6. Wait 5 minutes
