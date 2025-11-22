# 🚀 How to Use Your Ethical Data Exchange Application

## Step 1: Start the Application

Open your terminal/command prompt and run:

```bash
npm run dev
```

Wait for the message: `✓ Ready on http://localhost:3000`

## Step 2: Open in Browser

Open your web browser and go to:
```
http://localhost:3000
```

You should see the **Ethical Data Exchange** interface with:
- A dark gradient background (teal/cyan colors)
- Header with shield logo
- "Connect Wallet" button
- Status section
- Account Panel
- Marketplace Listings

---

## Step 3: Connect Your Wallet

### Option A: If you already have a Stellar wallet installed

1. **Click the "Connect Wallet" button** in the header (top right area)
2. A wallet selection modal will appear
3. **Choose your wallet** (Freighter, xBull, Albedo, etc.)
4. **Approve the connection** in your wallet popup
5. Your wallet address will appear in the Account Panel

### Option B: If you don't have a wallet yet

1. **Install a Stellar wallet**:
   - **Freighter** (Recommended): https://freighter.app/
   - **xBull**: https://xbull.app/
   - **Albedo**: Works in browser (no extension needed)
   - **Rabet**: https://rabet.io/
   - **Lobstr**: https://lobstr.co/

2. **Create a new account** in your wallet
3. **Switch to Testnet** in your wallet settings
4. Then follow **Option A** above

---

## Step 4: Fund Your Testnet Account

Before you can make purchases, you need test XLM:

1. **Copy your wallet address** from the Account Panel (starts with `G...`)
2. **Visit**: https://friendbot.stellar.org/
3. **Paste your address** in the input field
4. **Click "Fund Account"**
5. You'll receive **10,000 test XLM** (free testnet tokens)
6. **Wait 10-20 seconds**, then refresh your app
7. Your balance should appear in the Account Panel

---

## Step 5: Browse the Marketplace

Once your wallet is connected and funded:

1. **Scroll down** to the "Marketplace Listings" section
2. You'll see **3 data packages**:
   - Anonymized Q3 Web Traffic Trends (50 XLM)
   - Ethical Mobile App Usage Patterns (120.50 XLM)
   - Personalized Health Tracker Sync Data (5 XLM) - This one is marked "YOUR DATA"

3. Each listing shows:
   - **Title** and description
   - **Price** in XLM
   - **Seller** address (truncated)
   - **"Buy Access"** button

---

## Step 6: Purchase Data

1. **Click "Buy Access"** on any listing (except your own)
2. Your wallet will pop up asking you to **sign the transaction**
3. **Review the transaction details**:
   - Amount: The price in XLM
   - Destination: The seller's address
   - Memo: Contains the data package ID
4. **Approve the transaction** in your wallet
5. Wait for confirmation (usually 2-5 seconds)
6. You'll see:
   - ✅ Success message in the Status section
   - Transaction hash (clickable link to Stellar Expert)
   - Updated balance in Account Panel

---

## Step 7: View Transaction Details

1. After a successful purchase, you'll see a **transaction hash** in the Status section
2. **Click the hash** to open it on Stellar Expert
3. You can see:
   - Transaction details
   - Block information
   - All operations
   - Memo field (contains the data package ID)

---

## Step 8: Monitor Real-Time Transactions

The app automatically monitors your account:

1. **Transaction Stream**: Listens for new transactions in real-time
2. **Status Updates**: Shows when new transactions are detected
3. **Auto-Refresh**: Balances update automatically after transactions

---

## 🎯 Quick Reference

### Buttons and Actions

| Button/Link | What It Does |
|------------|--------------|
| **Connect Wallet** | Opens wallet selection modal |
| **Disconnect** (✕) | Disconnects your wallet |
| **Copy** (📋 icon) | Copies wallet address to clipboard |
| **Buy Access** | Purchases a data package |
| **Transaction Hash** | Opens transaction on Stellar Expert |

### Status Indicators

| Indicator | Meaning |
|-----------|---------|
| 🟢 **Online** | Wallet connected, ready to use |
| 🟠 **Connecting** | Wallet connection in progress |
| ✅ **Purchase detected** | Transaction completed successfully |
| 🔄 **Real-time** | New transaction detected |

---

## 🔧 Common Tasks

### Check Your Balance
- Look at the **Account Panel** → **Asset Holdings** section
- Shows XLM and DATA token balances

### Disconnect Wallet
- Click the **✕** button next to "Wallet Connected"
- Or refresh the page

### View Your Address
- Your wallet address is shown in the **Account Panel**
- Click the **copy icon** to copy it

### Make a Purchase
1. Find a listing you want
2. Click **"Buy Access"**
3. Approve in your wallet
4. Wait for confirmation

---

## ⚠️ Important Notes

1. **Testnet Only**: This app uses Stellar Testnet (not real money)
2. **Test XLM**: Get free test XLM from Friendbot
3. **Wallet Required**: You must connect a wallet to use the app
4. **No Secret Keys**: The app never stores or asks for secret keys
5. **Wallet Signs**: All transactions are signed by your wallet

---

## 🆘 Troubleshooting

### "Please connect your wallet"
- Click the **"Connect Wallet"** button
- Make sure your wallet extension is installed and enabled

### "Account not found"
- Fund your account using [Friendbot](https://friendbot.stellar.org/)
- Make sure you're on **Testnet** (not Mainnet)

### "Purchase failed"
- Check you have enough XLM (need at least the price + fees)
- Verify your account is funded
- Check browser console for error details

### Wallet won't connect
- Refresh the page
- Make sure wallet extension is enabled
- Try a different wallet
- Check browser console for errors

### No balances showing
- Wait a few seconds for account data to load
- Make sure wallet is connected
- Refresh the page
- Check your account on [Stellar Expert](https://stellar.expert/explorer/testnet)

---

## 📱 Supported Wallets

The app supports these Stellar wallets:
- ✅ Freighter
- ✅ xBull
- ✅ Albedo
- ✅ Rabet
- ✅ Lobstr
- ✅ Hana
- ✅ WalletConnect
- ✅ And more...

---

## 🎉 You're Ready!

Your Ethical Data Exchange marketplace is now ready to use. Connect your wallet, fund your account, and start exploring the marketplace!

**Happy trading! 🚀**

