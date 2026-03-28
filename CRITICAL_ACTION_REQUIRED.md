# CRITICAL ACTION REQUIRED: Testnet Configuration

## Problem Identified

The wallet connection is failing because **`/lib/system-config.ts` is LOCKED** and contains incorrect testnet configuration:

```typescript
export const PI_NETWORK_CONFIG = {
  SDK_URL: "https://sdk.minepi.com/pi-sdk.js",
  SDK_LITE_URL: "https://pi-apps.github.io/pi-sdk-lite/build/production/sdklite.js",
  SANDBOX: false,  // ❌ WRONG - Should be true for testnet
} as const;
```

## Required Fix

**You must UNLOCK `/lib/system-config.ts` and update it to:**

```typescript
export const PI_NETWORK_CONFIG = {
  SDK_URL: "https://sdk.minepi.com/pi-sdk.js",
  SDK_LITE_URL: "https://pi-apps.github.io/pi-sdk-lite/build/production/sdklite.js",
  SANDBOX: true,  // ✓ CORRECT for testnet
} as const;

export const PI_PLATFORM_URLS = {} as const;
```

## How to Unlock the File

1. In the file tree (left sidebar), right-click on `/lib/system-config.ts`
2. Click **Unlock**
3. Update the `SANDBOX: false` to `SANDBOX: true`
4. Save the file

## What This Changes

- `SANDBOX: true` tells the Pi SDK to use **Testnet** (not Mainnet)
- Pi Browser will now communicate with Pi Testnet infrastructure
- User authentication will work properly in Pi Browser Testnet environment

## Testing After Update

Once unlocked and updated:

1. Upload/deploy the app to Vercel (or test locally)
2. Open in **Pi Browser** (Testnet version)
3. Click "Connect Wallet"
4. You should see enhanced logging in browser console:
   ```
   [OS Execute] ============================================
   [OS Execute] Starting wallet connection...
   [OS Execute] Environment: pi-browser
   [OS Execute] SDK URL: https://sdk.minepi.com/pi-sdk.js
   [OS Execute] SDK Lite URL: https://pi-apps.github.io/pi-sdk-lite/build/production/sdklite.js
   [OS Execute] Sandbox mode: true
   [OS Execute] ============================================
   ```
5. Complete Pi Network authentication
6. Username and wallet address should display correctly

## Why This Matters

- **Without `SANDBOX: true`**: App tries to connect to Mainnet (which you don't have access to)
- **With `SANDBOX: true`**: App connects to Testnet (where you can test safely)

## Current Code Improvements

The wallet context has been enhanced with:
- ✓ Better error messages explaining what went wrong
- ✓ Detailed configuration logging for debugging
- ✓ Multiple fallback methods to extract user identity
- ✓ Clear distinction between configuration errors vs authentication errors

## Next Steps

1. **Unlock** `/lib/system-config.ts`
2. **Update** `SANDBOX: false` → `SANDBOX: true`
3. **Deploy** to Vercel
4. **Test** in Pi Browser Testnet
5. **Check console** for `[OS Execute]` logs to verify connection flow

## Expected Result

After these changes, the wallet connection will:
- Properly initialize Pi SDK in Testnet mode
- Successfully authenticate the user with Pi Network
- Display real @username from Pi account
- Display real wallet address
- Store session for cross-tab sync

---

**This is the blocker preventing wallet connection. Unlock the config file and update SANDBOX to true.**
