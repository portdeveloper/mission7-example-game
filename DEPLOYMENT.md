# Deployment Guide

## Environment Variables Required for Vercel

Before deploying to Vercel, make sure to set the following environment variables in your Vercel project settings:

### Required Variables:

1. **`WALLET_PRIVATE_KEY`**
   - The private key of a wallet that has `GAME_ROLE` permission on the contract
   - This wallet must have enough MON tokens for gas fees
   - Format: `0x...` (64 characters after 0x)

2. **`API_SECRET`**
   - A secure random string used for authentication
   - Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - Keep this secret and never expose it publicly
   - Example: `a1b2c3d4e5f6...` (64 character hex string)

3. **`NEXT_PUBLIC_PRIVY_APP_ID`**
   - Your Privy App ID for authentication
   - Get this from your Privy Dashboard
   - This is a public environment variable (prefixed with `NEXT_PUBLIC_`)

4. **`NEXT_PUBLIC_APP_URL`**
   - Your app's public URL for CORS validation
   - Example: `https://your-app.vercel.app`
   - Must match your actual deployed URL exactly

## Vercel Deployment Steps:

1. **Connect your GitHub repository to Vercel**
   
2. **Set environment variables in Vercel Dashboard:**
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add the required variables above

3. **Deploy:**
   - Vercel will automatically deploy when you push to your main branch
   - The build should now complete successfully

## Security Features Implemented:

✅ **Session-based Authentication**: Users must authenticate with their wallet to submit scores
✅ **Origin Validation**: API calls only accepted from your domain
✅ **Rate Limiting**: Prevents spam attacks (10 requests per minute per IP)
✅ **Request Deduplication**: Prevents duplicate transactions
✅ **Score Validation**: Realistic limits on score amounts and ratios
✅ **User-Agent Filtering**: Blocks automated tools like curl/Postman

## Important Notes:

- **Security**: The `WALLET_PRIVATE_KEY` and `API_SECRET` are sensitive. Never commit them to your repository.
- **Role Permissions**: Ensure your wallet has `GAME_ROLE` on the contract `0xceCBFF203C8B6044F52CE23D914A1bfD997541A4`
- **Gas Fees**: Keep your wallet funded with MON tokens for transaction fees
- **Privy Setup**: Configure your Privy app to support Monad Games ID authentication
- **URL Matching**: `NEXT_PUBLIC_APP_URL` must exactly match your deployed domain for security

## Testing Your Deployment:

### Automated Testing (Development):
For local testing, run the included test script:
```bash
npm run dev  # Start your dev server
node test-score-api.js  # Run the test script
```

### Manual API Testing:
After deployment, test these endpoints:

1. **Update Player Data:**
   ```bash
   curl -X POST https://your-app.vercel.app/api/update-player-data \
     -H "Content-Type: application/json" \
     -d '{
       "playerAddress": "0x...",
       "scoreAmount": 10,
       "transactionAmount": 1
     }'
   ```

2. **Get Player Data:**
   ```bash
   curl https://your-app.vercel.app/api/get-player-data?address=0x...
   ```

3. **Get Player Data Per Game:**
   ```bash
   curl https://your-app.vercel.app/api/get-player-data-per-game?playerAddress=0x...&gameAddress=0xceCBFF203C8B6044F52CE23D914A1bfD997541A4
   ```

### In-Game Testing:
1. **Login with Privy** - Connect your Monad Games ID
2. **Play the Space Shooter Game** - Score points by shooting enemies
3. **Check Blockchain Stats** - Click "Show Blockchain Stats" button (bottom-right)
4. **Monitor Submissions** - Watch for "Submitting score..." status in the UI
5. **Verify on Explorer** - Check your transactions on [Monad Explorer](https://testnet.monadexplorer.com/)

## Troubleshooting:

- **Build fails**: Check that all environment variables are set correctly
- **Unauthorized errors**: Verify your wallet has `GAME_ROLE` on the contract
- **Insufficient funds**: Ensure your wallet has enough MON tokens
- **Authentication issues**: Verify `NEXT_PUBLIC_PRIVY_APP_ID` is correct