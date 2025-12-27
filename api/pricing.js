export default function handler(req, res) {
  // Allow only GET
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const tiers = [
    { id: 'basic', priceUSD: 9, features: ['Promotion for 1 token', 'Standard exposure'] },
    { id: 'pro', priceUSD: 29, features: ['Promotion for 5 tokens', 'Priority scheduling'] },
    { id: 'enterprise', priceUSD: 99, features: ['Custom campaign', 'Dedicated support'] }
  ];

  res.status(200).json({ tiers });
}
