document.addEventListener('DOMContentLoaded', () => {
  let selectedPlan = null;
  let selectedPrice = 0;
  let walletConnected = false;
  let userWallet = null;

  // Elements
  const tokenInput = document.getElementById('tokenAddress');
  const tokenInfoEl = document.getElementById('tokenInfo');
  const paymentAmountEl = document.getElementById('paymentAmount');
  const paymentModal = document.getElementById('paymentModal');
  const connectBtn = document.getElementById('connectWallet');
  const payBtn = document.getElementById('payButton');

  // Use devnet while testing to avoid spending real SOL
  const USE_DEVNET_FOR_TESTS = true;
  const SOLANA_RPC = USE_DEVNET_FOR_TESTS
    ? 'https://api.devnet.solana.com'
    : 'https://api.mainnet-beta.solana.com';

  // Helper: show token info safely
  async function fetchTokenInfo(address) {
    tokenInfoEl.textContent = 'Checking token...';
    try {
      const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      if (data.pairs && data.pairs.length > 0) {
        const token = data.pairs[0];
        tokenInfoEl.innerHTML = `
          <div style="margin-top:15px; padding:15px; background:rgba(0,212,255,0.08); border-radius:10px;">
            <strong>${token.baseToken?.name || 'Unknown'} (${token.baseToken?.symbol || ''})</strong><br>
            Price: $${(parseFloat(token.priceUsd) || 0).toFixed(8)}<br>
            Liquidity: $${parseInt(token.liquidity?.usd || 0).toLocaleString()}
          </div>
        `;
      } else {
        tokenInfoEl.textContent = 'Token not found on Dexscreener.';
      }
    } catch (err) {
      console.error('Error fetching token:', err);
      tokenInfoEl.textContent = 'Failed to fetch token info.';
    }
  }

  // Event: token input
  if (tokenInput) {
    tokenInput.addEventListener('input', (e) => {
      const address = e.target.value.trim();
      if (address.length >= 32) {
        fetchTokenInfo(address);
      } else {
        tokenInfoEl.textContent = '';
      }
    });
  }

  // Plan selection
  window.selectPlan = function (plan, price) {
    const tokenAddress = tokenInput?.value?.trim();
    if (!tokenAddress || tokenAddress.length < 32) {
      alert('Please enter a valid token address first!');
      return;
    }
    selectedPlan = plan;
    selectedPrice = Number(price) || 0;
    paymentAmountEl.textContent = selectedPrice;
    if (paymentModal) paymentModal.style.display = 'flex';
  };

  window.closeModal = function () {
    if (paymentModal) paymentModal.style.display = 'none';
  };

  // Wallet connect
  window.connectWallet = async function () {
    try {
      if (window.solana && window.solana.isPhantom) {
        const resp = await window.solana.connect();
        userWallet = resp.publicKey.toString();
        walletConnected = true;
        if (connectBtn) connectBtn.textContent = `Connected: ${userWallet.slice(0, 4)}...${userWallet.slice(-4)}`;
        if (payBtn) payBtn.style.display = 'inline-block';
      } else {
        // Open Phantom download if not installed
        window.open('https://phantom.app/', '_blank');
      }
    } catch (err) {
      console.error('Wallet connection failed:', err);
      alert('Wallet connection failed.');
    }
  };

  // Send payment + call backend
  window.sendPayment = async function () {
    if (!walletConnected || !userWallet) {
      alert('Please connect wallet first!');
      return;
    }
    if (!selectedPrice || selectedPrice <= 0) {
      alert('Invalid price selected.');
      return;
    }

    // Disable pay button while processing
    if (payBtn) {
      payBtn.disabled = true;
      payBtn.textContent = 'Processing...';
    }

    try {
      const connection = new solanaWeb3.Connection(SOLANA_RPC, 'confirmed');

      // Replace this with your real receiver before going to mainnet
      const receiverAddress = 'YOUR_RECEIVER_WALLET_ADDRESS';
      if (!receiverAddress || receiverAddress === 'YOUR_RECEIVER_WALLET_ADDRESS') {
        throw new Error('Receiver wallet not configured. Replace YOUR_RECEIVER_WALLET_ADDRESS.');
      }

      // Prepare lamports (rounded)
      const lamports = Math.round(Number(selectedPrice) * solanaWeb3.LAMPORTS_PER_SOL);
      if (lamports <= 0) throw new Error('Invalid lamports amount');

      // Get recent blockhash once
      const latest = await connection.getLatestBlockhash();
      const transaction = new solanaWeb3.Transaction({
        recentBlockhash: latest.blockhash,
        feePayer: new solanaWeb3.PublicKey(userWallet)
      }).add(
        solanaWeb3.SystemProgram.transfer({
          fromPubkey: new solanaWeb3.PublicKey(userWallet),
          toPubkey: new solanaWeb3.PublicKey(receiverAddress),
          lamports
        })
      );

      // Sign & send
      const signed = await window.solana.signTransaction(transaction);
      const raw = signed.serialize();
      const signature = await connection.sendRawTransaction(raw);

      // Confirm using the same blockhash info
      await connection.confirmTransaction({
        signature,
        blockhash: latest.blockhash,
        lastValidBlockHeight: latest.lastValidBlockHeight
      }, 'finalized');

      // Call backend to trigger promotion
      const tokenAddress = tokenInput?.value?.trim();
      const res = await fetch('/api/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenAddress,
          campaignType: selectedPlan,
          campaignStyle: 'viral',
          paymentId: signature
        })
      });
      const result = await res.json();
      if (result.success) {
        alert('🚀 Payment successful! Your token promotion has started!');
        window.closeModal();
      } else {
        console.error('Promotion response:', result);
        alert('Payment succeeded but promotion failed. Check console for details.');
      }
    } catch (err) {
      console.error('Payment failed:', err);
      alert('Payment failed: ' + (err.message || err));
    } finally {
      if (payBtn) {
        payBtn.disabled = false;
        payBtn.textContent = 'Pay Now';
      }
    }
  };
});
