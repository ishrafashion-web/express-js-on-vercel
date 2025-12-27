export default function handler(req, res) {
  res.json({
    tiers: [
      {
        id: 'basic',
        name: 'Basic',
        price: 0.5,
        currency: 'SOL',
        duration: '1 hour',
        features: [
          'Telegram post',
          'Twitter post',
          'Basic analytics'
        ]
      },
      {
        id: 'advanced',
        name: 'Advanced',
        price: 1,
        currency: 'SOL',
        duration: '3 hours',
        features: [
          'Homepage token feature',
          'Social media spotlight',
          'Priority trending listing',
          '3-hour dashboard highlight',
          'LinkedIn post'
        ]
      },
      {
        id: 'premium',
        name: 'Premium',
        price: 2,
        currency: 'SOL',
        duration: '24 hours',
        features: [
          'All Advanced features',
          'Multiple scheduled posts',
          'Full analytics report',
          'Priority support',
          'Custom campaign style'
        ]
      }
    ]
  });
}
