"use client";
import React, { useState, useEffect } from 'react';
import Script from 'next/script';
import { stellar } from '@/lib/stellar-helper';
// Replacing lucide-react imports with standard components or emojis to fix compilation error
// import { Database, TrendingUp, ShieldCheck, Zap } from 'lucide-react'; 

// TypeScript global augmentation for window.StellarSdk
declare global {
  interface Window {
    StellarSdk?: any;
  }
}

// ----------------------------------------------------------------------
// 1. UTILITY FUNCTIONS (Defined outside App to avoid re-creation on render)
// ----------------------------------------------------------------------

// Stellar Configuration
const networkPassphrase = 'Test SDF Network ; September 2015';
const DATA_ASSET_CODE = 'DATA';

// These will be replaced by wallet connection
// Users will connect their wallet instead of using hardcoded keys
let MASTER_PUBLIC_KEY = 'G...'; // Will be set from connected wallet
let MASTER_SECRET_KEY = 'S...'; // Not needed - wallet will sign transactions


// Note: Trustline creation will be handled through wallet signing when needed

// Mock data for the marketplace - sellerPublicKey will be dynamically updated
const getMarketplaceData = (userPublicKey: string = 'G...') => [
    {
        id: 'A1B2C3D4',
        sellerPublicKey: 'GA4P...R32Y', // Mock Seller
        title: 'Anonymized Q3 Web Traffic Trends',
        priceXLM: '50.00',
        description: 'Aggregate demographic and referral data from 10,000 users over three months. GDPR-compliant.',
        tokensRequired: '1',
    },
    {
        id: 'E5F6G7H8',
        sellerPublicKey: 'GB5Q...S43Z', // Mock Seller
        title: 'Ethical Mobile App Usage Patterns (Last 7 Days)',
        priceXLM: '120.50',
        description: 'Focus on productivity app interaction frequency (time series data).',
        tokensRequired: '3',
    },
    {
        id: 'I9J0K1L2',
        sellerPublicKey: userPublicKey, // The current user selling their own data
        title: 'Personalized Health Tracker Sync Data',
        priceXLM: '5.00',
        description: 'Single-user, anonymized daily step and sleep cycles (low-value, high-volume data).',
        tokensRequired: '0.1',
    },
];


function App() {
  const [stellarSdk, setStellarSdk] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [connectedPublicKey, setConnectedPublicKey] = useState<string>('');
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  
  type Balance = {
    balance: string;
    asset_type: string;
    asset_code?: string;
  };
  const [accountBalance, setAccountBalance] = useState<Balance[]>([]);
  const [marketStatus, setMarketStatus] = useState('Please connect your wallet to begin');
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  // Stellar objects, initialized after SDK is loaded
  const [server, setServer] = useState<any>(null);
  const [dataAsset, setDataAsset] = useState<any>(null);

  // Wallet connection handler
  const handleConnectWallet = async () => {
    try {
      setIsConnectingWallet(true);
      setMarketStatus('Connecting wallet...');
      const publicKey = await stellar.connectWallet();
      setConnectedPublicKey(publicKey);
      MASTER_PUBLIC_KEY = publicKey;
      setIsWalletConnected(true);
      setMarketStatus('Wallet connected! Loading account data...');
      
      // Initialize SDK and load account data
      if (window.StellarSdk && server) {
        const sdk = window.StellarSdk;
        const asset = new sdk.Asset(DATA_ASSET_CODE, publicKey);
        setDataAsset(asset);
        await loadAccountData(sdk, server, asset);
      } else if (window.StellarSdk) {
        // If server not ready yet, wait a bit and try again
        setTimeout(async () => {
          if (server && window.StellarSdk) {
            const sdk = window.StellarSdk;
            const asset = new sdk.Asset(DATA_ASSET_CODE, publicKey);
            setDataAsset(asset);
            await loadAccountData(sdk, server, asset);
          }
        }, 1000);
      }
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      setMarketStatus(`Wallet connection failed: ${error.message || 'Please try again'}`);
      setIsWalletConnected(false);
      setConnectedPublicKey('');
    } finally {
      setIsConnectingWallet(false);
    }
  };

  const handleDisconnectWallet = () => {
    stellar.disconnect();
    setIsWalletConnected(false);
    setConnectedPublicKey('');
    MASTER_PUBLIC_KEY = 'G...';
    setAccountBalance([]);
    setIsReady(false);
    setMarketStatus('Wallet disconnected. Please connect your wallet to begin.');
  };

  // Function to load account data and check asset trustline
  const loadAccountData = async (sdk: any, srv: any, asset: any) => {
    if (!srv || !connectedPublicKey) return;

    try {
      setMarketStatus('Connecting to Stellar Horizon...');
      
      // 1. Fetch Account Details
      const account = await srv.loadAccount(connectedPublicKey);
      setAccountBalance(account.balances);

      // 2. Check for DATA Trustline
      const hasTrustline = account.balances.some(
        (balance: Balance) => balance.asset_code === DATA_ASSET_CODE
      );

      if (!hasTrustline) {
        setMarketStatus('Account ready. Trustline for DATA token missing. Please create trustline using your wallet.');
        setIsReady(false);
        // Note: Trustline creation will need wallet signature, handled separately
      } else {
        setMarketStatus('Marketplace is Online. Ready for Data Transactions.');
        setIsReady(true);
      }

    } catch (error: any) {
      console.error("Error loading Stellar account:", error);
      setAccountBalance([]);
      if (error.response?.status === 404) {
        setMarketStatus('Account not found. Please fund your account using the Stellar Friendbot.');
      } else {
        setMarketStatus(`Error: Could not load account. ${error.message || 'Check console for details.'}`);
      }
      setIsReady(false);
    }
  };


  // Effect 1: Handle script loading and initialize connection
  useEffect(() => {
    setMarketStatus('Loading Stellar SDK...');
    
    const checkStellarSdk = setInterval(() => {
      if (window.StellarSdk) {
        clearInterval(checkStellarSdk);
        const sdk = window.StellarSdk;
        setStellarSdk(sdk);
        setMarketStatus('Stellar SDK loaded. Please connect your wallet to begin.');
        
        // Initialize Stellar Objects after SDK is available
        // Set the network passphrase based on environment (crucial for transactions)
        sdk.Network.useTestNetwork(); 
        
        const srv = new sdk.Server('https://horizon-testnet.stellar.org');
        setServer(srv);
        console.log('Stellar SDK and Server initialized successfully');
        
        // Asset will be created when wallet connects
        // Only load account data if wallet is already connected
        if (isWalletConnected && connectedPublicKey) {
          const asset = new sdk.Asset(DATA_ASSET_CODE, connectedPublicKey);
          setDataAsset(asset);
          loadAccountData(sdk, srv, asset);
        } else {
          setMarketStatus('Stellar SDK ready. Please connect your wallet to begin.');
        }
        
      }
    }, 500);

    return () => clearInterval(checkStellarSdk);
  }, []); // Run only once on mount - SDK loads independently

  // Mock function for simulating a data sale (The current user is the Seller, receiving XLM)
  // This is replaced by the Marketplace component for a more realistic flow.
  const handleSimulateSale = async () => {
    if (!isReady || !stellarSdk || !server || !dataAsset) {
      setMarketStatus('Marketplace not ready. Please wait for connection or check errors.');
      return;
    }
    setMarketStatus('This button now performs a mock BUY to demonstrate the process. Please use the Marketplace below.');
  };
  
  // New function for handling a data purchase (The current user is the Buyer, paying XLM)
  const handleBuyData = async (dataItem: { id: string; sellerPublicKey: string; title: string; priceXLM: string; description: string; tokensRequired: string }) => {
    if (!isReady || !isWalletConnected || !connectedPublicKey || !server || !dataAsset) {
        setMarketStatus('Please connect your wallet first.');
        return;
    }

    if (dataItem.sellerPublicKey === connectedPublicKey) {
        setMarketStatus("You can't buy data from yourself!");
        return;
    }
    
    try {
        setMarketStatus(`Preparing purchase of "${dataItem.title}" for ${dataItem.priceXLM} XLM...`);
        
        // Use stellar helper to send payment (it handles wallet signing)
        const result = await stellar.sendPayment({
          from: connectedPublicKey,
          to: dataItem.sellerPublicKey,
          amount: dataItem.priceXLM,
          memo: `BUY-${dataItem.id}`
        });
        
        if (result.success) {
          setLastTxHash(result.hash);
          setMarketStatus(`Purchase successful! TX Hash: ${result.hash.substring(0, 10)}...`);
          console.log("Purchase Transaction result:", result);
          
          // Reload balance after transaction
          if (window.StellarSdk && server && dataAsset) {
            setTimeout(() => loadAccountData(window.StellarSdk, server, dataAsset), 2000);
          }
        } else {
          setMarketStatus('Purchase failed! Transaction was not successful.');
        }

    } catch (error: any) {
        console.error("Error submitting purchase transaction:", error);
        setMarketStatus(`Purchase failed! ${error.message || 'See console for details.'}`);
    }
  };


  // ----------------------------------------------------------------------
  // 3. UI RENDERING
  // ----------------------------------------------------------------------
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(20, 184, 166, 0.4); }
          50% { box-shadow: 0 0 40px rgba(20, 184, 166, 0.7); }
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        ::-webkit-scrollbar {
          width: 10px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.3);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #14b8a6, #06b6d4);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #06b6d4, #3b82f6);
        }
      `}} />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-teal-900/30 to-cyan-900/40 flex items-start justify-center p-4 py-8 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-teal-500/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute top-40 right-20 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }}></div>
          <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '2.5s' }}></div>
          <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '0.5s' }}></div>
        </div>
        
        {/* Stellar SDK CDN */}
        <Script 
          src="https://cdnjs.cloudflare.com/ajax/libs/stellar-sdk/11.3.0/stellar-sdk.min.js" 
          strategy="beforeInteractive"
        />
        
      
        <div className="w-full max-w-7xl space-y-6 relative z-10">
          {/* Modern Header */}
          <header className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-600 shadow-2xl shadow-teal-500/50 mb-5 animate-pulse-glow">
              <span className="text-5xl">🛡️</span>
            </div>
            <h1 className="text-6xl font-black bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent mb-3 tracking-tight">
              Ethical Data Exchange
            </h1>
            <p className="text-xl text-gray-300 font-light mb-4">
              Decentralized marketplace for user-owned data
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-gray-800/70 backdrop-blur-md border border-teal-500/30 shadow-lg">
                <div className={`w-3 h-3 rounded-full ${isReady ? 'bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50' : 'bg-amber-400 animate-pulse shadow-lg shadow-amber-400/50'}`}></div>
                <span className="text-sm font-medium text-gray-200">Stellar Testnet</span>
              </div>
              
              {/* Wallet Connection Button */}
              {!isWalletConnected ? (
                <button
                  onClick={handleConnectWallet}
                  disabled={isConnectingWallet}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConnectingWallet ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <span>🔗</span>
                      <span>Connect Wallet</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-emerald-500/20 backdrop-blur-md border-2 border-emerald-500/40 shadow-lg">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-emerald-300">Wallet Connected</span>
                  <button
                    onClick={handleDisconnectWallet}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    title="Disconnect wallet"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* Improved Layout: Two-column grid for Status and Account */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Modern Status Section */}
            <div className="bg-gray-800/70 backdrop-blur-xl rounded-3xl p-6 border border-teal-500/20 shadow-2xl hover:border-teal-500/40 transition-all">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg">
                    <span className="text-xl">📊</span>
                  </div>
                  Connection Status
                </h2>
                <div className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                  isReady ? 'bg-emerald-500/20 text-emerald-300 border-2 border-emerald-500/40 shadow-lg shadow-emerald-500/20' : 'bg-amber-500/20 text-amber-300 border-2 border-amber-500/40 shadow-lg shadow-amber-500/20'
                }`}>
                {isReady ? '● Online' : '● Connecting'}
                </div>
              </div>
              
              {/* Market Status Display */}
              <div className="mb-5 p-4 rounded-2xl bg-gray-900/60 border border-gray-700/50">
                <p className={`text-base font-semibold ${isReady ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {marketStatus}
                </p>
              </div>

              {/* Transaction Hash Link */}
              {lastTxHash && (
                <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-blue-500/10 border border-teal-500/30 backdrop-blur-sm">
                  <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Last Transaction</p>
                  <a 
                    href={`https://stellar.expert/explorer/testnet/tx/${lastTxHash}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="group flex items-center gap-2 text-sm text-teal-400 hover:text-cyan-300 break-all font-mono transition-colors"
                  >
                    <span className="truncate">{lastTxHash}</span>
                    <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <p className="text-xs text-gray-500 mt-2">View on Stellar Expert</p>
                </div>
              )}

              {/* Connection Details Grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'SDK', value: stellarSdk ? '✓' : '✗', status: stellarSdk, tooltip: 'Stellar SDK loaded from CDN' },
                  { label: 'Server', value: server ? '✓' : '✗', status: server, tooltip: 'Horizon server connected' },
                  { label: 'Asset', value: dataAsset ? '✓' : '✗', status: dataAsset, tooltip: isWalletConnected ? 'DATA asset defined' : 'Connect wallet to define asset' },
                  { label: 'Ready', value: isReady && isWalletConnected ? '✓' : '✗', status: isReady && isWalletConnected, tooltip: isWalletConnected ? (isReady ? 'Ready for transactions' : 'Waiting for account data') : 'Connect wallet to begin' },
                ].map((item, idx) => (
                  <div 
                    key={idx} 
                    className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-700/50 text-center hover:border-teal-500/50 transition-all"
                    title={item.tooltip}
                  >
                    <p className="text-xs text-gray-400 mb-1.5 font-medium">{item.label}</p>
                    <p className={`text-xl font-bold ${item.status ? 'text-emerald-400' : 'text-red-400'}`}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Modern Account Panel */}
            <div className="bg-gray-800/70 backdrop-blur-xl rounded-3xl p-6 border border-cyan-500/20 shadow-2xl hover:border-cyan-500/40 transition-all">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <span className="text-2xl">👤</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Account Panel</h2>
                  <p className="text-sm text-gray-400">Your Stellar wallet details</p>
                </div>
              </div>
              
              {/* Wallet Public Key Display */}
              <div className="mb-6 p-4 rounded-2xl bg-gray-900/60 border border-gray-700/50">
                <h3 className="text-xs font-bold text-gray-400 mb-2.5 uppercase tracking-wider">
                  {isWalletConnected ? 'Connected Wallet Address' : 'Wallet Address'}
                </h3>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono text-gray-300 break-all flex-1">
                    {isWalletConnected ? connectedPublicKey : 'Not connected'}
                  </p>
                  {isWalletConnected && (
                    <button 
                      onClick={() => navigator.clipboard.writeText(connectedPublicKey)}
                      className="p-2.5 rounded-xl bg-gray-700 hover:bg-teal-600 transition-all hover:scale-110"
                      title="Copy to clipboard"
                    >
                      <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  )}
                </div>
                {!isWalletConnected && (
                  <p className="text-xs text-gray-500 mt-2">Connect your wallet to view your account</p>
                )}
              </div>

              {/* Account Balances */}
              <div>
                <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">Asset Holdings</h3>
                {accountBalance.length > 0 ? (
                  <div className="space-y-3">
                    {accountBalance.map((balance, index) => {
                      const assetCode = balance.asset_code || 'XLM';
                      const balanceAmount = parseFloat(balance.balance).toFixed(2);
                      const isXLM = balance.asset_type === 'native' || assetCode === 'XLM';
                      const isDATA = assetCode === DATA_ASSET_CODE;
                      
                      return (
                        <div 
                          key={index} 
                          className={`flex justify-between items-center p-4 rounded-2xl border backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-lg ${
                            isDATA 
                              ? 'bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border-teal-500/40' 
                              : isXLM 
                              ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/40' 
                              : 'bg-gray-900/60 border-gray-700/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${
                              isDATA ? 'bg-teal-500/30' : isXLM ? 'bg-amber-500/30' : 'bg-gray-700'
                            }`}>
                              <span className="text-2xl">
                                {isXLM ? '⭐' : isDATA ? '💾' : '📊'}
                              </span>
                            </div>
                            <div>
                              <span className="font-bold text-white text-lg block">{assetCode}</span>
                              <p className="text-xs text-gray-400">{isXLM ? 'Stellar Lumens' : isDATA ? 'Data Token' : 'Custom Asset'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-bold text-white">{balanceAmount}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10 rounded-2xl bg-gray-900/60 border border-gray-700/50">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                      <span className="text-4xl">💼</span>
                    </div>
                    <p className="text-sm text-gray-400">No balances loaded yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Modern Marketplace Display */}
          <div className="mt-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl">
                <span className="text-3xl">🛍️</span>
              </div>
              <div>
                <h2 className="text-3xl font-black text-white">Marketplace Listings</h2>
                <p className="text-sm text-gray-400 font-medium">Browse available data packages</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {getMarketplaceData(connectedPublicKey).map((item) => (
                <div 
                  key={item.id} 
                  className={`group bg-gray-800/70 backdrop-blur-xl rounded-3xl p-6 border shadow-2xl flex flex-col transition-all duration-300 hover:scale-[1.03] hover:shadow-teal-500/30 ${
                    item.sellerPublicKey === MASTER_PUBLIC_KEY 
                      ? 'border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-orange-500/10' 
                      : 'border-gray-700/50 hover:border-teal-500/50'
                  }`}
                >
                  {/* Title */}
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-bold text-white flex-1 leading-tight pr-2">
                      {item.title}
                    </h3>
                    {item.sellerPublicKey === connectedPublicKey && (
                      <span className="ml-2 px-3 py-1 text-xs font-black bg-gradient-to-r from-amber-400 to-orange-500 text-gray-900 rounded-full whitespace-nowrap shadow-lg">
                        YOUR DATA
                      </span>
                    )}
                  </div>
                  
                  {/* Description */}
                  <p className="text-sm text-gray-300 mb-6 flex-1 min-h-[70px] leading-relaxed">
                    {item.description}
                  </p>
                  
                  {/* Price and Seller Info */}
                  <div className="mt-auto space-y-4 pt-5 border-t border-gray-700/50">
                    {/* Price */}
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30">
                      <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Price</span>
                      <p className="text-2xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                        {item.priceXLM} XLM
                      </p>
                    </div>
                    
                    {/* Seller */}
                    <div className="flex items-center justify-between p-2">
                      <span className="text-xs text-gray-400 font-medium">Seller</span>
                      <p className="text-xs text-gray-300 font-mono truncate ml-2 max-w-[140px]" title={item.sellerPublicKey}>
                        {item.sellerPublicKey.length > 12 
                          ? `${item.sellerPublicKey.substring(0, 8)}...${item.sellerPublicKey.substring(item.sellerPublicKey.length - 4)}`
                          : item.sellerPublicKey
                        }
                      </p>
                    </div>
                    
                    {/* Buy Button */}
                    <button
                      onClick={() => handleBuyData(item)}
                    disabled={!isReady || !isWalletConnected || item.sellerPublicKey === connectedPublicKey}
                    className={`w-full px-5 py-3.5 text-sm font-bold rounded-2xl transition-all duration-300 ${
                      isReady && isWalletConnected && item.sellerPublicKey !== connectedPublicKey
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-xl shadow-emerald-500/50 hover:shadow-emerald-500/70 transform hover:scale-[1.02] active:scale-[0.98]'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {item.sellerPublicKey === connectedPublicKey ? 'Listed by You' : !isWalletConnected ? 'Connect Wallet' : 'Buy Access'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;