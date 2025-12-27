let selectedPlan = null;
let selectedPrice = 0;
let walletConnected = false;
let userWallet = null;
const RECEIVER_WALLET = 'sYW7sHFW5ybWu9PxV7xtydKRRKgJsJPtLbdCeCNGoYt';
document.getElementById('tokenAddress').addEventListener('input', async (e) => {
  const address = e.target.value.trim();
  if (address.length >= 32) {
    document.getElementById('tokenInfo').innerHTML = '<p style="color:#888;">🔍 Loading...</p>';
    try {
      const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`);
      const data = await res.json();
      if (data.pairs && data.pairs.length > 0) {
        const token = data.pairs[0];
        document.getElementById('tokenInfo').innerHTML = `
          <div style="margin-top:15px;padding:15px;background:rgba(0,212,255,0.1);border-radius:10px;">
            <strong>${token.baseToken.name} (${token.baseToken.symbol})</strong><br>
            💰 $${parseFloat(token.priceUsd || 0).toFixed(8)}<br>
            💧 Liq: $${parseInt(token.liquidity?.usd || 0).toLocaleString()}
          </div>`;
      } else {
        document.getElementById('tokenInfo').innerHTML = '<p style="color:#ff6b6b;">❌ Token not found</p>';
      }
    } catch (err) {
      document.getElementById('tokenInfo').innerHTML = '<p style="color:#ff6b6b;">❌ Error</p>';
    }
  }
});
function selectPlan(plan, price) {
  const tokenAddress = document.getElementById('tokenAddress').value.trim();
  if (!tokenAddress || tokenAddress.length < 32) {
    alert('⚠️ Enter a valid token address first!');
    return;
  }
  selectedPlan = plan;
  selectedPrice = price;
  document.getElementById('selectedPlanName').textContent = plan.toUpperCase();
  document.getElementById('paymentAmount').textContent = price;
  document.getElementById('walletAddress').textContent = RECEIVER_WALLET;
  document.getElementById('paymentModal').style.display = 'flex';
}
function closeModal() {
  document.getElementById('paymentModal').style.display = 'none';
}
async function connectWallet() {
  if (window.solana && window.solana.isPhantom) {
    const response = await window.solana.connect();
    userWallet = response.publicKey.toString();
    walletConnected = true;
    document.getElementById('connectWallet').innerHTML = `✅ ${userWallet.slice(0,4)}...${userWallet.slice(-4)}`;
    document.getElementById('payButton').style.display = 'block';
  } else {
    window.open('https://phantom.app/', '_blank');
  }
}
async function sendPayment() {
  if (!walletConnected) return alert('Connect wallet first!');
  try {
    document.getElementById('payButton').textContent = 'Processing...';
    const connection = new solanaWeb3.Connection('https://api.mainnet-beta.solana.com');
    const transaction = new solanaWeb3.Transaction().add(
      solanaWeb3.SystemProgram.transfer({
        fromPubkey: new solanaWeb3.PublicKey(userWallet),
        toPubkey: new solanaWeb3.PublicKey(RECEIVER_WALLET),
        lamports: selectedPrice * solanaWeb3.LAMPORTS_PER_SOL
      })
    );
    transaction.feePayer = new solanaWeb3.PublicKey(userWallet);
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    const signed = await window.solana.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction(signature);
    const tokenAddress = document.getElementById('tokenAddress').value;
    await fetch('/api/promote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenAddress, campaignType: selectedPlan, campaignStyle: 'viral', paymentId: signature })
    });
    alert('🚀 Success! Your token promotion has started!');
    closeModal();
  } catch (err) {
    alert('Payment failed: ' + err.message);
  }
  document.getElementById('payButton').textContent = '💰 Pay Now';
}
window.onclick = (e) => { if (e.target.id === 'paymentModal') closeModal(); };
