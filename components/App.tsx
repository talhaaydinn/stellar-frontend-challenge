"use client";
import React, { useState, useEffect } from 'react';
import Script from 'next/script';

// TypeScript global augmentation for window.StellarSdk
declare global {
  interface Window {
    StellarSdk?: any;
  }
}

// ----------------------------------------------------------------------
// Testnet Constants
// ----------------------------------------------------------------------
const networkPassphrase = 'Test SDF Network ; September 2015';
const DATA_ASSET_CODE = 'DATA';
const MASTER_PUBLIC_KEY = 'G...'; // Placeholder - replace with actual public key
const MASTER_SECRET_KEY = 'S...'; // Placeholder - replace with actual secret key

// ----------------------------------------------------------------------
// Mock Marketplace Data
// ----------------------------------------------------------------------
const marketplaceData = [
  {
    id: 'A1B2C3D4',
    sellerPublicKey: 'GA4P...R32Y', // Mock Seller
    title: 'Anonymized Q3 Web Traffic Trends',
    priceXLM: '50.00',
    description: 'Aggregate demographic and referral data from 10,000 users over three months. GDPR-compliant.',
  },
  {
    id: 'E5F6G7H8',
    sellerPublicKey: 'GB5Q...S43Z', // Mock Seller
    title: 'Ethical Mobile App Usage Patterns (Last 7 Days)',
    priceXLM: '120.50',
    description: 'Focus on productivity app interaction frequency (time series data).',
  },
  {
    id: 'I9J0K1L2',
    sellerPublicKey: MASTER_PUBLIC_KEY, // The current user selling their own data
    title: 'Personalized Health Tracker Sync Data',
    priceXLM: '5.00',
    description: 'Single-user, anonymized daily step and sleep cycles (low-value, high-volume data).',
  },
];

// ----------------------------------------------------------------------
// App Component
// ----------------------------------------------------------------------
function App() {
  // SDK Management State
  const [stellarSdk, setStellarSdk] = useState<any>(null);
  
  // Connection Status State
  const [marketStatus, setMarketStatus] = useState('Initializing...');
  const [isReady, setIsReady] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  
  // Account Balance State
  type Balance = {
    balance: string;
    asset_type: string;
    asset_code?: string;
  };
  const [accountBalance, setAccountBalance] = useState<Balance[]>([]);
  
  // Stellar Objects (Server and DataAsset)
  const [server, setServer] = useState<any>(null);
  const [dataAsset, setDataAsset] = useState<any>(null);

  // ----------------------------------------------------------------------
  // Core Asynchronous Functions
  // ----------------------------------------------------------------------

  /**
   * Creates a trustline for the DATA asset
   * @param account - The Stellar account object
   * @param StellarSdk - The Stellar SDK instance
   * @param server - The Stellar Horizon server instance
   * @param DataAsset - The Stellar Asset object for DATA
   * @param setMarketStatus - Function to update UI status
   * @param setIsReady - Function to set application readiness
   */
  const createTrustline = async (
    account: any,
    StellarSdk: any,
    server: any,
    DataAsset: any,
    setMarketStatus: (status: string) => void,
    setIsReady: (ready: boolean) => void
  ) => {
    try {
      const sourceKeypair = StellarSdk.Keypair.fromSecret(MASTER_SECRET_KEY);
      
      // Create a new transaction using TransactionBuilder
      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: '100', // Set the base fee
        networkPassphrase: networkPassphrase
      })
      .addOperation(
        StellarSdk.Operation.changeTrust({
          asset: DataAsset,
          limit: '1000000000', // Set a high limit
        })
      )
      .setTimeout(30)
      .build();

      // Sign the transaction using MASTER_SECRET_KEY
      transaction.sign(sourceKeypair);
      
      // Submit the transaction to the server
      const result = await server.submitTransaction(transaction);
      console.log("Trustline created successfully:", result);
      
      // Update marketStatus on success
      setMarketStatus('Trustline created successfully! Marketplace is Online.');
      setIsReady(true);

    } catch (error: any) {
      console.error("Error creating trustline:", error);
      
      // Enhanced error handling for network/transaction failures
      let errorMessage = 'Error creating trustline. ';
      if (error.response) {
        // Horizon API error
        const horizonError = error.response.data;
        errorMessage += horizonError?.detail || horizonError?.title || 'Horizon API error.';
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Unknown error occurred.';
      }
      errorMessage += ' Ensure account is funded and MASTER_SECRET_KEY is correct.';
      
      // Update marketStatus on failure
      setMarketStatus(errorMessage);
      setIsReady(false);
    }
  };

  /**
   * Loads account data and checks for DATA asset trustline
   * @param sdk - The Stellar SDK instance
   * @param srv - The Stellar Horizon server instance
   * @param asset - The Stellar Asset object for DATA
   */
  const loadAccountData = async (sdk: any, srv: any, asset: any) => {
    if (!srv) return;

    try {
      setMarketStatus('Connecting to Stellar Horizon...');
      
      // Load the Stellar account using server.loadAccount(MASTER_PUBLIC_KEY)
      const account = await srv.loadAccount(MASTER_PUBLIC_KEY);
      
      // Update the accountBalance state
      setAccountBalance(account.balances);

      // Check if the account has a Trustline for the DATA asset
      const hasTrustline = account.balances.some(
        (balance: Balance) => balance.asset_code === DATA_ASSET_CODE
      );

      if (!hasTrustline) {
        // If the trustline is missing, call the createTrustline function
        setMarketStatus('Account ready. Trustline for DATA token missing. Creating now...');
        await createTrustline(account, sdk, srv, asset, setMarketStatus, setIsReady);
      } else {
        // If present, set isReady to true and update marketStatus
        setMarketStatus('Marketplace is Online. Ready for Data Transactions.');
        setIsReady(true);
      }

    } catch (error: any) {
      console.error("Error loading Stellar account:", error);
      setAccountBalance([]);
      
      // Enhanced error handling for network/transaction failures
      let errorMessage = 'Error: Could not connect to Stellar or load account. ';
      if (error.response) {
        // Horizon API error
        const horizonError = error.response.data;
        if (horizonError?.status === 404) {
          errorMessage += 'Account not found. Ensure MASTER_PUBLIC_KEY is correct and funded.';
        } else {
          errorMessage += horizonError?.detail || horizonError?.title || 'Horizon API error.';
        }
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Network error. Check your connection.';
      }
      
      setMarketStatus(errorMessage);
      setIsReady(false);
    }
  };

  /**
   * Handles the purchase of a data item from the marketplace
   * @param dataItem - The marketplace data item to purchase
   */
  const handleBuyData = async (dataItem: typeof marketplaceData[0]) => {
    if (!isReady || !stellarSdk || !server || !dataAsset) {
      setMarketStatus('Marketplace not ready. Please wait for connection or check errors.');
      return;
    }

    if (dataItem.sellerPublicKey === MASTER_PUBLIC_KEY) {
      setMarketStatus("You can't buy data from yourself! This is a mock transaction.");
      return;
    }

    try {
      // Load the current account details
      const sourceAccount = await server.loadAccount(MASTER_PUBLIC_KEY);
      const sourceKeypair = stellarSdk.Keypair.fromSecret(MASTER_SECRET_KEY);
      const price = dataItem.priceXLM;
      const destination = dataItem.sellerPublicKey;

      // Create a TransactionBuilder for a new transaction
      const transaction = new stellarSdk.TransactionBuilder(sourceAccount, {
        fee: '100',
        networkPassphrase: networkPassphrase,
        // Attach the data package ID to the transaction using the Stellar Memo.text
        memo: stellarSdk.Memo.text(`BUY-${dataItem.id}`)
      })
      // Add an Operation.payment where the current user pays the priceXLM (using StellarSdk.Asset.native() for XLM) to the dataItem.sellerPublicKey
      .addOperation(
        stellarSdk.Operation.payment({
          destination: destination,
          asset: stellarSdk.Asset.native(), // Paying in XLM (native asset)
          amount: price,
        })
      )
      .setTimeout(30)
      .build();

      // Sign and submit the transaction
      transaction.sign(sourceKeypair);
      
      setMarketStatus(`Attempting purchase of "${dataItem.title}" for ${price} XLM...`);
      const result = await server.submitTransaction(transaction);
      
      // Update the marketStatus with the success and the resulting transaction hash (lastTxHash)
      setLastTxHash(result.hash);
      setMarketStatus(`Purchase successful! TX Hash: ${result.hash.substring(0, 10)}... (Check console)`);
      console.log("Purchase Transaction result:", result);
      
      // Reload balance after transaction
      setTimeout(() => loadAccountData(stellarSdk, server, dataAsset), 2000);

    } catch (error: any) {
      console.error("Error submitting purchase transaction:", error);
      
      // Enhanced error handling for network/transaction failures
      let errorMessage = 'Purchase failed! ';
      if (error.response) {
        // Horizon API error
        const horizonError = error.response.data;
        const extras = horizonError?.extras;
        
        if (extras?.result_codes?.transaction === 'tx_insufficient_balance') {
          errorMessage += 'Insufficient XLM balance to complete the purchase.';
        } else if (extras?.result_codes?.transaction === 'tx_bad_seq') {
          errorMessage += 'Sequence number error. Please try again.';
        } else if (extras?.result_codes?.transaction === 'tx_failed') {
          errorMessage += `Transaction failed: ${extras.result_codes?.operations?.join(', ') || 'Unknown operation error'}.`;
        } else {
          errorMessage += horizonError?.detail || horizonError?.title || 'Transaction submission failed.';
        }
      } else if (error.message) {
        if (error.message.includes('insufficient')) {
          errorMessage += 'Insufficient XLM balance.';
        } else if (error.message.includes('network')) {
          errorMessage += 'Network error. Check your connection.';
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += 'Unknown error occurred. Check console for details.';
      }
      
      // Update marketStatus with the failure
      setMarketStatus(errorMessage);
      setLastTxHash(null);
    }
  };

  // ----------------------------------------------------------------------
  // SDK Loading Effect - Polls for window.StellarSdk until loaded
  // ----------------------------------------------------------------------
  useEffect(() => {
    setMarketStatus('Loading Stellar SDK...');
    
    const checkStellarSdk = setInterval(() => {
      if (window.StellarSdk) {
        clearInterval(checkStellarSdk);
        
        const sdk = window.StellarSdk;
        setStellarSdk(sdk);
        setMarketStatus('Stellar SDK loaded. Initializing Test Network...');
        
        // Initialize Test Network
        sdk.Network.useTestNetwork();
        
        // Create Server instance pointing to horizon-testnet.stellar.org
        const srv = new sdk.Server('https://horizon-testnet.stellar.org');
        setServer(srv);
        
        // Define the DataAsset
        const asset = new sdk.Asset(DATA_ASSET_CODE, MASTER_PUBLIC_KEY);
        setDataAsset(asset);
        
        setMarketStatus('Stellar SDK initialized. Loading account data...');
        
        // Load account data and check for trustline
        loadAccountData(sdk, srv, asset);
      }
    }, 500);

    return () => clearInterval(checkStellarSdk);
  }, []); // Run only once on mount

  // ----------------------------------------------------------------------
  // Transaction Stream Listener - Real-time transaction monitoring
  // ----------------------------------------------------------------------
  useEffect(() => {
    // The effect should run whenever the server object is initialized
    if (!server) return;

    console.log('Setting up transaction stream listener...');

    // Set up the transaction stream listener
    // Call server.transactions().forAccount(MASTER_PUBLIC_KEY).cursor('now').stream()
    const stream = server
      .transactions()
      .forAccount(MASTER_PUBLIC_KEY)
      .cursor('now')
      .stream();

    // The stream should invoke a callback for every new transaction involving the current user's public key
    const handleMessage = (transaction: any) => {
      try {
        // Extract transaction ID or hash for UI feedback
        const txId = transaction.id || transaction.hash || 'unknown';
        const txHash = transaction.hash || transaction.id || 'unknown';
        
        // UI Feedback: When a new transaction is detected on the stream, set the marketStatus
        // to clearly indicate that a new transaction (tx.id or tx.hash) was processed in real-time
        setMarketStatus(`🔄 Real-time: New transaction detected! TX: ${txHash.substring(0, 12)}...`);
        
        // Update lastTxHash if available
        if (txHash && txHash !== 'unknown') {
          setLastTxHash(txHash);
        }

        // Check the transaction's memo field
        let memoText = '';
        
        // Handle Horizon API format (memo_type and memo fields)
        if (transaction.memo_type === 'text' && transaction.memo) {
          memoText = transaction.memo;
        }
        // Handle Stellar SDK format (memo object)
        else if (transaction.memo) {
          const memo = transaction.memo;
          
          // If memo is already a string
          if (typeof memo === 'string') {
            memoText = memo;
          }
          // If memo has a _type and _value (Stellar SDK internal format)
          else if (memo._type === 'text' && memo._value) {
            // Try to decode base64 if needed, or use directly if already decoded
            try {
              // In browser, use atob for base64 decoding
              if (typeof window !== 'undefined' && typeof atob !== 'undefined') {
                memoText = atob(memo._value);
              } else {
                memoText = memo._value.toString();
              }
            } catch {
              memoText = memo._value.toString();
            }
          }
          // If memo has a value property
          else if (memo.value) {
            memoText = memo.value.toString();
          }
          // If memo is an object with text property
          else if (memo.text) {
            memoText = memo.text;
          }
        }

        // Data Delivery Simulation: Inside the callback, check the transaction's memo field.
        // If the memo text starts with 'BUY-', log a message to the console that says
        // 'Successfully purchased data! Simulating delivery of decryption key for ID: [Memo Content]'
        if (memoText && memoText.startsWith('BUY-')) {
          console.log(`Successfully purchased data! Simulating delivery of decryption key for ID: ${memoText}`);
          
          // Update UI to show purchase was detected
          setMarketStatus(`✅ Purchase detected! Data delivery simulated for ID: ${memoText.substring(4)}`);
        }
      } catch (error) {
        console.error('Error processing transaction memo:', error);
      }
    };

    const handleError = (error: any) => {
      // Error handling for transaction stream failures
      console.error('Transaction stream error:', error);
      // Optionally update status if stream fails critically
      if (error.code === 'ECONNREFUSED' || error.message?.includes('connection')) {
        console.warn('Transaction stream connection lost. Stream will attempt to reconnect.');
        setMarketStatus('⚠️ Transaction stream connection lost. Attempting to reconnect...');
      }
    };

    // Subscribe to stream events
    stream.on('message', handleMessage);
    stream.on('error', handleError);

    // Cleanup function to stop the stream subscription
    const closeStreamSubscription = () => {
      if (stream) {
        try {
          stream.removeListener('message', handleMessage);
          stream.removeListener('error', handleError);
          if (typeof stream.close === 'function') {
            stream.close();
          }
          console.log('Transaction stream subscription closed.');
        } catch (error) {
          console.error('Error closing stream subscription:', error);
        }
      }
    };

    // Cleanup: Ensure the useEffect returns a cleanup function to stop the stream subscription
    // when the component unmounts or dependencies change
    return () => {
      closeStreamSubscription();
    };
  }, [server]); // Run whenever the server object is initialized

  // ----------------------------------------------------------------------
  // UI Rendering
  // ----------------------------------------------------------------------
  return (
    <>
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          background-size: 1000px 100%;
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
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-teal-900/30 to-cyan-900/40 flex items-start justify-center p-4 py-8 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-teal-500/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute top-40 right-20 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }}></div>
          <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '2.5s' }}></div>
          <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '0.5s' }}></div>
        </div>
        
        {/* CDN Script Tags - Loaded via Next.js Script component */}
        <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />
        <Script 
          src="https://cdnjs.cloudflare.com/ajax/libs/stellar-sdk/11.3.0/stellar-sdk.min.js" 
          strategy="beforeInteractive"
          onLoad={() => {
            // Script loaded, the useEffect will detect window.StellarSdk
          }}
        />
      
      <div className="w-full max-w-7xl space-y-6 relative z-10">
        {/* Modern Header with improved layout */}
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
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-gray-800/70 backdrop-blur-md border border-teal-500/30 shadow-lg">
            <div className={`w-3 h-3 rounded-full ${isReady ? 'bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50' : 'bg-amber-400 animate-pulse shadow-lg shadow-amber-400/50'}`}></div>
            <span className="text-sm font-medium text-gray-200">Stellar Testnet</span>
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
                { label: 'SDK', value: stellarSdk ? '✓' : '✗', status: stellarSdk },
                { label: 'Server', value: server ? '✓' : '✗', status: server },
                { label: 'Asset', value: dataAsset ? '✓' : '✗', status: dataAsset },
                { label: 'Ready', value: isReady ? '✓' : '✗', status: isReady },
              ].map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-700/50 text-center hover:border-teal-500/50 transition-all">
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
            
            {/* Master Public Key Display */}
            <div className="mb-6 p-4 rounded-2xl bg-gray-900/60 border border-gray-700/50">
              <h3 className="text-xs font-bold text-gray-400 mb-2.5 uppercase tracking-wider">Public Key</h3>
              <div className="flex items-center gap-2">
                <p className="text-sm font-mono text-gray-300 break-all flex-1">
                  {MASTER_PUBLIC_KEY}
                </p>
                <button 
                  onClick={() => navigator.clipboard.writeText(MASTER_PUBLIC_KEY)}
                  className="p-2.5 rounded-xl bg-gray-700 hover:bg-teal-600 transition-all hover:scale-110"
                  title="Copy to clipboard"
                >
                  <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
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

        {/* Modern Marketplace Display with improved layout */}
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
            {marketplaceData.map((item) => (
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
                  {item.sellerPublicKey === MASTER_PUBLIC_KEY && (
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
                    disabled={!isReady || item.sellerPublicKey === MASTER_PUBLIC_KEY}
                    className={`w-full px-5 py-3.5 text-sm font-bold rounded-2xl transition-all duration-300 ${
                      isReady && item.sellerPublicKey !== MASTER_PUBLIC_KEY
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-xl shadow-emerald-500/50 hover:shadow-emerald-500/70 transform hover:scale-[1.02] active:scale-[0.98]'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {item.sellerPublicKey === MASTER_PUBLIC_KEY ? 'Listed by You' : 'Buy Access'}
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

