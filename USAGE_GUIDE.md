# Ethical Data Exchange - Usage Guide

## 🚀 Quick Start

### 1. Install Dependencies

Make sure you have Node.js installed (version 18 or higher), then install the project dependencies:

```bash
npm install
```

### 2. Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### 3. Open in Browser

Open your browser and navigate to `http://localhost:3000`

---

## 📱 How to Use the Application

### Step 1: Connect Your Wallet

1. **Install a Stellar Wallet** (if you don't have one):
   - **Freighter** (Recommended): [Install Freighter Extension](https://freighter.app/)
   - **xBull**: [Install xBull Extension](https://xbull.app/)
   - **Albedo**: Works in browser
   - **Rabet**: [Install Rabet Extension](https://rabet.io/)
   - **Lobstr**: [Install Lobstr Extension](https://lobstr.co/)
   - **Hana**: [Install Hana Extension](https://hana.app/)

2. **Fund Your Testnet Account** (if needed):
   - Visit [Stellar Friendbot](https://friendbot.stellar.org/)
   - Enter your public key (starts with `G...`)
   - Click "Fund Account" to receive 10,000 test XLM

3. **Connect Your Wallet**:
   - Click the **"Connect Wallet"** button in the header
   - Select your preferred wallet from the modal
   - Approve the connection in your wallet
   - Your wallet address will appear in the Account Panel

### Step 2: View Your Account

Once connected, you'll see:
- **Connected Wallet Address**: Your Stellar public key
- **Asset Holdings**: Your XLM and DATA token balances
- **Connection Status**: Real-time connection indicators

### Step 3: Browse Marketplace

The marketplace displays available data packages:
- **Title**: Name of the data package
- **Description**: What data is included
- **Price**: Cost in XLM
- **Seller**: The seller's public key (truncated)

### Step 4: Purchase Data

1. Find a data package you want to purchase
2. Click the **"Buy Access"** button
3. Your wallet will prompt you to sign the transaction
4. Approve the transaction in your wallet
5. Wait for confirmation (transaction appears in Status section)
6. The transaction hash will be displayed with a link to Stellar Expert

### Step 5: View Transactions

- **Real-time Updates**: The app monitors transactions automatically
- **Transaction Hash**: Click the hash link to view on Stellar Expert
- **Status Updates**: The status section shows real-time transaction processing

---

## 🔧 Features

### ✅ Wallet Connection
- Connect any supported Stellar wallet
- Secure transaction signing (no secret keys stored)
- Disconnect anytime

### ✅ Account Management
- View your Stellar account balance
- See XLM and DATA token holdings
- Copy wallet address to clipboard

### ✅ Marketplace
- Browse available data packages
- Purchase data with XLM
- Real-time transaction monitoring

### ✅ Transaction History
- View last transaction hash
- Link to Stellar Expert explorer
- Real-time transaction stream

---

## 🛠️ Troubleshooting

### Wallet Won't Connect

**Problem**: "Wallet connection failed"

**Solutions**:
1. Make sure your wallet extension is installed and enabled
2. Refresh the page and try again
3. Check browser console for error messages
4. Try a different wallet if available

### Account Not Found

**Problem**: "Account not found" error

**Solutions**:
1. Fund your account using [Stellar Friendbot](https://friendbot.stellar.org/)
2. Make sure you're on Testnet (not Mainnet)
3. Verify your wallet is connected to Testnet

### Transaction Fails

**Problem**: "Purchase failed" error

**Solutions**:
1. Check you have sufficient XLM balance
2. Ensure your account is funded
3. Check the console for detailed error messages
4. Verify the seller's account is valid

### No Balances Showing

**Problem**: "No balances loaded yet"

**Solutions**:
1. Make sure your wallet is connected
2. Wait a few seconds for account data to load
3. Refresh the page
4. Check your account on [Stellar Expert](https://stellar.expert/)

---

## 📋 Requirements

- **Node.js**: Version 18 or higher
- **Browser**: Modern browser (Chrome, Firefox, Edge, Safari)
- **Wallet**: Any supported Stellar wallet extension
- **Network**: Testnet account (for testing)

---

## 🔐 Security Notes

- **Never share your secret keys**: The app uses wallet signing, so secret keys are never stored
- **Testnet Only**: This application uses Stellar Testnet for testing
- **Wallet Security**: Always verify transactions in your wallet before signing
- **Transaction Review**: Check transaction details before approving

---

## 💡 Tips

1. **Start with Testnet**: Use test XLM from Friendbot to practice
2. **Check Balances**: Always verify you have enough XLM before purchasing
3. **Monitor Transactions**: Watch the status section for real-time updates
4. **Explore Stellar Expert**: Click transaction hashes to view on blockchain explorer
5. **Disconnect When Done**: Click disconnect to end your session

---

## 🆘 Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your wallet is properly installed
3. Ensure you're using Testnet (not Mainnet)
4. Check that your account is funded

---

## 📚 Additional Resources

- [Stellar Documentation](https://developers.stellar.org/)
- [Stellar Wallets Kit](https://github.com/creit-tech/stellar-wallets-kit)
- [Stellar Testnet Friendbot](https://friendbot.stellar.org/)
- [Stellar Expert Explorer](https://stellar.expert/)

---

## 🎯 Next Steps

After connecting your wallet:
1. Explore the marketplace listings
2. Check your account balances
3. Try purchasing a data package
4. Monitor real-time transactions
5. View transactions on Stellar Expert

Enjoy using the Ethical Data Exchange marketplace! 🚀

