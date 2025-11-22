# 🛡️ Ethical Data Exchange

> **A decentralized marketplace for user-owned data built on Stellar blockchain**

Ethical Data Exchange is a modern web application that enables users to buy and sell anonymized data packages in a transparent, decentralized marketplace. Built with Next.js, TypeScript, and the Stellar blockchain, this platform empowers users to monetize their own data while maintaining privacy and control.

[![Stellar](https://img.shields.io/badge/Stellar-Testnet-blue)](https://stellar.org)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)](https://tailwindcss.com)

![Screenshot 1](screen/Screenshot%202025-11-22%20203809.png)

![Screenshot 2](screen/Screenshot%202025-11-22%20203828.png)

![Screenshot 3](screen/Screenshot%202025-11-22%20203850.png)

![Screenshot 4](screen/Screenshot%202025-11-22%20203907.png)

---

## 🎯 What is This Project?

Ethical Data Exchange is a **decentralized data marketplace** that allows users to:

- **Sell Your Data**: List anonymized data packages (web traffic, app usage, health metrics, etc.) for sale
- **Buy Data Access**: Purchase data packages from other users using Stellar Lumens (XLM)
- **Own Your Data**: Maintain full control and ownership of your data through blockchain transactions
- **Transparent Transactions**: All transactions are recorded on the Stellar blockchain and publicly verifiable

### Key Features

✨ **Wallet Integration**
- Connect with multiple Stellar wallets (Freighter, xBull, Albedo, etc.)
- Secure transaction signing through wallet providers
- No private keys stored in the application

💰 **Account Management**
- View real-time XLM and DATA token balances
- Monitor account status and trustlines
- Track transaction history with explorer links

🛍️ **Marketplace**
- Browse available data packages
- See pricing, descriptions, and seller information
- One-click purchase with wallet confirmation
- Identify your own listings

🔒 **Security & Privacy**
- All transactions signed by user's wallet
- No centralized data storage
- GDPR-compliant data handling
- Transparent blockchain-based transactions

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org/)
- **A Stellar Wallet** - Install one of these:
  - [Freighter](https://freighter.app) (Recommended)
  - [xBull](https://xbull.app)
  - [Lobstr](https://lobstr.co)
  - Or any other [supported wallet](https://github.com/Creit-Tech/Stellar-Wallets-Kit#compatible-wallets)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd stellar-frontend-challenge

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Get Testnet XLM

1. Connect your wallet in the application
2. Copy your Stellar address
3. Visit [Stellar Laboratory](https://laboratory.stellar.org/#account-creator?network=test)
4. Paste your address and click "Fund"
5. You'll receive 10,000 testnet XLM for free!

---

## 📖 How It Works

### 1. Connect Your Wallet

Click the "Connect Wallet" button to link your Stellar wallet. The application will:
- Open the Stellar Wallets Kit modal
- Allow you to select your preferred wallet
- Retrieve your public key (address)
- Load your account balances

### 2. View Your Account

Once connected, you can see:
- **Wallet Address**: Your Stellar public key
- **Asset Holdings**: XLM balance and DATA token balance (if trustline exists)
- **Connection Status**: Real-time status of SDK, server, and asset connections

### 3. Browse the Marketplace

The marketplace displays available data packages:
- **Data Package Title**: Description of the data being sold
- **Price**: Cost in XLM
- **Seller**: The Stellar address of the data seller
- **Description**: Details about the data package

### 4. Purchase Data

To buy a data package:
1. Click "Buy Access" on any listing (except your own)
2. Your wallet will prompt you to sign the transaction
3. Confirm the payment in your wallet
4. The transaction is submitted to the Stellar network
5. View the transaction hash and link to Stellar Expert explorer

### 5. Transaction Tracking

All transactions include:
- Transaction hash for verification
- Direct links to Stellar Expert explorer
- Automatic balance refresh after transactions
- Transaction history tracking

---

## 📁 Project Structure

```
stellar-frontend-challenge/
├── app/
│   ├── globals.css          # Global styles and Tailwind CSS
│   ├── layout.tsx           # Root layout with metadata
│   └── page.tsx             # Main application page (Ethical Data Exchange UI)
├── components/
│   ├── App.tsx              # Main app component (legacy)
│   ├── WalletConnection.tsx # Wallet connect/disconnect component
│   ├── BalanceDisplay.tsx   # Balance display component
│   ├── PaymentForm.tsx      # Payment form component
│   ├── TransactionHistory.tsx # Transaction history component
│   ├── BonusFeatures.tsx    # Additional feature templates
│   └── example-components.tsx # Reusable UI components
├── lib/
│   └── stellar-helper.ts    # ⚠️ Blockchain logic (DO NOT MODIFY)
├── package.json
├── tailwind.config.js       # Tailwind CSS configuration
└── tsconfig.json            # TypeScript configuration
```

---

## 🛠️ Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 14.2.0 | React framework with App Router |
| **TypeScript** | 5.4.5 | Type safety and developer experience |
| **Tailwind CSS** | 3.4.4 | Utility-first CSS framework |
| **Stellar SDK** | 12.3.0 | Stellar blockchain interactions |
| **Stellar Wallets Kit** | 1.9.5 | Multi-wallet support and connection |
| **React Icons** | 5.0.1 | Icon library |

---

## 🔧 Key Components

### Main Application (`app/page.tsx`)

The main application component that includes:
- Wallet connection/disconnection
- Account balance display
- Marketplace listings
- Purchase functionality
- Transaction tracking
- Real-time status updates

### Stellar Helper (`lib/stellar-helper.ts`)

**⚠️ DO NOT MODIFY THIS FILE**

This file contains all blockchain logic:
- Wallet connection via Stellar Wallets Kit
- Balance retrieval from Horizon API
- Payment transaction building and signing
- Transaction history fetching
- Explorer link generation

### Available Methods

```typescript
import { stellar } from '@/lib/stellar-helper';

// Connect wallet
const address = await stellar.connectWallet();

// Get balance
const { xlm, assets } = await stellar.getBalance(address);

// Send payment
const result = await stellar.sendPayment({
  from: senderAddress,
  to: recipientAddress,
  amount: "10.5",
  memo: "Payment for data package"
});

// Get transaction history
const transactions = await stellar.getRecentTransactions(address, 10);

// Get explorer link
const link = stellar.getExplorerLink(txHash, 'tx');

// Format address
const short = stellar.formatAddress(address, 4, 4);

// Disconnect
stellar.disconnect();
```

---

## 🎨 Customization

### Styling

The application uses Tailwind CSS for styling. Customize colors and themes in:
- `app/globals.css` - Global styles
- `tailwind.config.js` - Tailwind configuration
- Component className props - Inline Tailwind classes

### Marketplace Data

Currently, marketplace listings are mock data defined in `app/page.tsx`. To customize:

```typescript
const getMarketplaceData = (userPublicKey: string) => [
  {
    id: 'unique-id',
    sellerPublicKey: 'G...',
    title: 'Your Data Package Title',
    priceXLM: '50.00',
    description: 'Description of the data',
    tokensRequired: '1',
  },
  // Add more listings...
];
```

---

## 🔐 Security Considerations

- **Never share your private keys** - The application never requests or stores private keys
- **Wallet signing** - All transactions are signed by your wallet, not the application
- **Testnet only** - This application uses Stellar Testnet for development
- **Trustline required** - DATA token requires a trustline to be created before use
- **Transaction verification** - Always verify transactions on Stellar Expert explorer

---

## 🐛 Troubleshooting

### Wallet won't connect?
- Ensure you have a Stellar wallet extension installed
- Check that you're on Testnet (not Mainnet)
- Try refreshing the page
- Check browser console for errors

### Balance shows 0?
- Fund your testnet account at [Stellar Laboratory](https://laboratory.stellar.org/#account-creator?network=test)
- Wait a few seconds for the balance to update
- Check that your wallet is connected

### Transaction fails?
- Ensure you have enough XLM (keep at least 1 XLM as reserve)
- Verify the recipient address is valid
- Check that you're on Testnet
- Ensure you have a DATA token trustline if required

### Build errors?
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json .next
npm install
npm run dev
```

### Static assets 404 errors?
```bash
# Clean build directory
rm -rf .next
npm run dev
```

---

## 📚 Learning Resources

### Stellar Blockchain
- [Stellar Documentation](https://developers.stellar.org/)
- [Stellar Laboratory](https://laboratory.stellar.org/) - Test tools
- [Stellar Expert](https://stellar.expert/explorer/testnet) - Blockchain explorer
- [Stellar Testnet](https://www.stellar.org/developers/guides/get-started/create-account.html#testnet)

### Stellar Wallets Kit
- [GitHub Repository](https://github.com/Creit-Tech/Stellar-Wallets-Kit)
- [Documentation](https://stellarwalletskit.dev/)

### Frontend Technologies
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Documentation](https://react.dev/)

---

## 🚫 Important Notes

1. **DO NOT** modify `lib/stellar-helper.ts` - This contains critical blockchain logic
2. **Testnet only** - This application is configured for Stellar Testnet
3. **Mock data** - Marketplace listings are currently mock data for demonstration
4. **Wallet required** - You must have a Stellar wallet installed to use this application
5. **No private keys** - The application never handles or stores private keys

---

## 🤝 Contributing

This is an open-source project! Feel free to:
- Fork and customize for your needs
- Submit improvements via pull requests
- Report issues and bugs
- Share your implementations

---

## 📝 License

MIT License - Feel free to use this for learning, development, or commercial projects!

---

## 🌟 Features Roadmap

Potential future enhancements:
- [ ] Real data package storage and retrieval
- [ ] User authentication and profiles
- [ ] Advanced search and filtering
- [ ] Data package ratings and reviews
- [ ] Seller dashboard
- [ ] Analytics and insights
- [ ] Mobile app version
- [ ] Multi-asset support
- [ ] Smart contract integration
- [ ] Decentralized storage integration

---

## 💡 Tips for Users

1. **Start with Testnet** - Always test with testnet XLM before using mainnet
2. **Keep XLM reserve** - Stellar accounts require a minimum balance (1 XLM)
3. **Verify transactions** - Always check transactions on Stellar Expert
4. **Secure your wallet** - Use strong passwords and backup your wallet
5. **Read descriptions** - Review data package details before purchasing

---

## 🆘 Support

Need help?
- Check the [Troubleshooting](#-troubleshooting) section
- Review [Stellar Documentation](https://developers.stellar.org/)
- Join [Stellar Discord](https://discord.gg/stellardev)
- Visit [Stellar Community](https://stellar.org/community)

---

**Made with ❤️ for the Stellar Community**

Happy Trading! 🚀✨
