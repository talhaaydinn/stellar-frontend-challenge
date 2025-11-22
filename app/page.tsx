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
      if (window.StellarSdk && window.StellarSdk.Asset && server) {
        const sdk = window.StellarSdk;
        const asset = new sdk.Asset(DATA_ASSET_CODE, publicKey);
        setDataAsset(asset);
        await loadAccountData(sdk, server, asset);
      } else if (window.StellarSdk && window.StellarSdk.Asset) {
        // If server not ready yet, wait a bit and try again
        setTimeout(async () => {
          if (server && window.StellarSdk && window.StellarSdk.Asset) {
            const sdk = window.StellarSdk;
            const asset = new sdk.Asset(DATA_ASSET_CODE, publicKey);
            setDataAsset(asset);
            await loadAccountData(sdk, server, asset);
          }
        }, 1000);
      } else {
        setMarketStatus('Stellar SDK not fully loaded. Please wait and try again.');
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
      if (window.StellarSdk && window.StellarSdk.Network && window.StellarSdk.Server) {
        clearInterval(checkStellarSdk);
        try {
          const sdk = window.StellarSdk;
          setStellarSdk(sdk);
          setMarketStatus('Stellar SDK loaded. Please connect your wallet to begin.');
          
          // Initialize Stellar Objects after SDK is available
          // Set the network passphrase based on environment (crucial for transactions)
          if (sdk.Network && typeof sdk.Network.useTestNetwork === 'function') {
            sdk.Network.useTestNetwork();
          }
          
          if (sdk.Server) {
            const srv = new sdk.Server('https://horizon-testnet.stellar.org');
            setServer(srv);
            console.log('Stellar SDK and Server initialized successfully');
            
            // Asset will be created when wallet connects
            // Only load account data if wallet is already connected
            if (isWalletConnected && connectedPublicKey) {
              if (sdk.Asset) {
                const asset = new sdk.Asset(DATA_ASSET_CODE, connectedPublicKey);
                setDataAsset(asset);
                loadAccountData(sdk, srv, asset);
              }
            } else {
              setMarketStatus('Stellar SDK ready. Please connect your wallet to begin.');
            }
          }
        } catch (error) {
          console.error('Error initializing Stellar SDK:', error);
          setMarketStatus('Error loading Stellar SDK. Please refresh the page.');
        }
      }
    }, 500);

    // Timeout after 30 seconds
    const timeout = setTimeout(() => {
      clearInterval(checkStellarSdk);
      if (!window.StellarSdk) {
        setMarketStatus('Stellar SDK failed to load. Please check your internet connection and refresh.');
      }
    }, 30000);

    return () => {
      clearInterval(checkStellarSdk);
      clearTimeout(timeout);
    };
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
          if (window.StellarSdk && window.StellarSdk.Asset && server && dataAsset) {
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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}} />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
        
        {/* Stellar SDK CDN */}
        <Script 
          src="https://cdnjs.cloudflare.com/ajax/libs/stellar-sdk/11.3.0/stellar-sdk.min.js" 
          strategy="lazyOnload"
          onLoad={() => {
            console.log('Stellar SDK script loaded');
            if (window.StellarSdk) {
              console.log('StellarSdk available:', Object.keys(window.StellarSdk));
            }
          }}
          onError={() => {
            console.error('Failed to load Stellar SDK');
          }}
        />
        
      
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Professional Header */}
          <header className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-slate-900 mb-2">
                  Ethical Data Exchange
                </h1>
                <p className="text-lg text-slate-600">
                  Decentralized marketplace for user-owned data
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 border border-slate-200">
                  <div className={`w-2 h-2 rounded-full ${isReady ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                  <span className="text-sm font-medium text-slate-700">Testnet</span>
                </div>
                
                {/* Wallet Connection Button */}
                {!isWalletConnected ? (
                  <button
                    onClick={handleConnectWallet}
                    disabled={isConnectingWallet}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isConnectingWallet ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>Connect Wallet</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 border border-green-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-700">Connected</span>
                    <button
                      onClick={handleDisconnectWallet}
                      className="ml-2 text-slate-400 hover:text-slate-600 transition-colors"
                      title="Disconnect wallet"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Professional Layout: Two-column grid for Status and Account */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Status Section */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  Connection Status
                </h2>
                <div className={`px-3 py-1 rounded-md text-xs font-medium ${
                  isReady ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {isReady ? 'Online' : 'Connecting'}
                </div>
              </div>
              
              {/* Market Status Display */}
              <div className="mb-6 p-4 rounded-lg bg-slate-50 border border-slate-200">
                <p className={`text-sm font-medium ${isReady ? 'text-green-700' : 'text-amber-700'}`}>
                  {marketStatus}
                </p>
              </div>

              {/* Transaction Hash Link */}
              {lastTxHash && (
                <div className="mb-6 p-4 rounded-lg bg-indigo-50 border border-indigo-100">
                  <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Last Transaction</p>
                  <a 
                    href={`https://stellar.expert/explorer/testnet/tx/${lastTxHash}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="group flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 break-all font-mono transition-colors"
                  >
                    <span className="truncate">{lastTxHash}</span>
                    <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <p className="text-xs text-slate-500 mt-2">View on Stellar Expert</p>
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
                    className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-center hover:border-indigo-300 transition-colors"
                    title={item.tooltip}
                  >
                    <p className="text-xs text-slate-600 mb-2 font-medium">{item.label}</p>
                    <p className={`text-lg font-semibold ${item.status ? 'text-green-600' : 'text-red-500'}`}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Account Panel */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Account Panel</h2>
                  <p className="text-sm text-slate-600">Your Stellar wallet details</p>
                </div>
              </div>
              
              {/* Wallet Public Key Display */}
              <div className="mb-6 p-4 rounded-lg bg-slate-50 border border-slate-200">
                <h3 className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                  {isWalletConnected ? 'Connected Wallet Address' : 'Wallet Address'}
                </h3>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono text-slate-700 break-all flex-1">
                    {isWalletConnected ? connectedPublicKey : 'Not connected'}
                  </p>
                  {isWalletConnected && (
                    <button 
                      onClick={() => navigator.clipboard.writeText(connectedPublicKey)}
                      className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 hover:border-indigo-300 transition-colors"
                      title="Copy to clipboard"
                    >
                      <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  )}
                </div>
                {!isWalletConnected && (
                  <p className="text-xs text-slate-500 mt-2">Connect your wallet to view your account</p>
                )}
              </div>

              {/* Account Balances */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">Asset Holdings</h3>
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
                          className={`flex justify-between items-center p-4 rounded-lg border transition-all hover:shadow-sm ${
                            isDATA 
                              ? 'bg-indigo-50 border-indigo-200' 
                              : isXLM 
                              ? 'bg-amber-50 border-amber-200' 
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              isDATA ? 'bg-indigo-100' : isXLM ? 'bg-amber-100' : 'bg-slate-100'
                            }`}>
                              <span className="text-lg">
                                {isXLM ? '⭐' : isDATA ? '💾' : '📊'}
                              </span>
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900 text-base block">{assetCode}</span>
                              <p className="text-xs text-slate-600">{isXLM ? 'Stellar Lumens' : isDATA ? 'Data Token' : 'Custom Asset'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xl font-bold text-slate-900">{balanceAmount}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                      <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm text-slate-600">No balances loaded yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Marketplace Display */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Marketplace Listings</h2>
                <p className="text-sm text-slate-600">Browse available data packages</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {getMarketplaceData(connectedPublicKey).map((item) => (
                <div 
                  key={item.id} 
                  className={`group bg-white rounded-xl p-6 border shadow-sm flex flex-col transition-all duration-200 hover:shadow-md ${
                    item.sellerPublicKey === MASTER_PUBLIC_KEY 
                      ? 'border-amber-300 bg-amber-50/50' 
                      : 'border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  {/* Title */}
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-base font-semibold text-slate-900 flex-1 leading-snug pr-2">
                      {item.title}
                    </h3>
                    {item.sellerPublicKey === connectedPublicKey && (
                      <span className="ml-2 px-2.5 py-1 text-xs font-semibold bg-amber-100 text-amber-700 rounded-md whitespace-nowrap border border-amber-200">
                        YOUR DATA
                      </span>
                    )}
                  </div>
                  
                  {/* Description */}
                  <p className="text-sm text-slate-600 mb-6 flex-1 min-h-[70px] leading-relaxed">
                    {item.description}
                  </p>
                  
                  {/* Price and Seller Info */}
                  <div className="mt-auto space-y-3 pt-5 border-t border-slate-200">
                    {/* Price */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                      <span className="text-xs text-slate-600 font-medium uppercase tracking-wide">Price</span>
                      <p className="text-xl font-bold text-indigo-600">
                        {item.priceXLM} XLM
                      </p>
                    </div>
                    
                    {/* Seller */}
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs text-slate-600 font-medium">Seller</span>
                      <p className="text-xs text-slate-700 font-mono truncate ml-2 max-w-[140px]" title={item.sellerPublicKey}>
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
                      className={`w-full px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                        isReady && isWalletConnected && item.sellerPublicKey !== connectedPublicKey
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow-md'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
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