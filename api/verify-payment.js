export default async function handler(req, res) {
  // Simple POST endpoint that "verifies" a SOL payment by paymentId.
  // In production, replace with a real Solana RPC / indexer verification.
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { paymentId, expectedAmount } = req.body || {};
  if (!paymentId || typeof paymentId !== 'string') {
    return res.status(400).json({ error: 'paymentId is required' });
  }

  // Mock verification: if paymentId contains "SOL" or length > 10, consider confirmed
  const confirmed = paymentId.includes('SOL') || paymentId.length > 10;

  return res.status(200).json({
    paymentId,
    confirmed,
    amount: confirmed ? Number(expectedAmount || 0) : 0,
    verifiedAt: confirmed ? new Date().toISOString() : null
  });
}
