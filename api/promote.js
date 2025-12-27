export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tokenAddress, campaignType, campaignStyle, userEmail, paymentId } = req.body || {};

  // Basic token address validation:
  // If it looks like an Ethereum address (0x...), require 42 chars and hex; otherwise require a minimum length.
  const isEthLike = typeof tokenAddress === 'string' && tokenAddress.startsWith('0x');
  const isValidEth = isEthLike && /^0x[0-9a-fA-F]{40}$/.test(tokenAddress);
  const isValidGeneric = typeof tokenAddress === 'string' && tokenAddress.length >= 32;

  if (!tokenAddress || (!isValidEth && !isValidGeneric)) {
    return res.status(400).json({ error: 'Invalid token address' });
  }

  const SIM_WORKFLOW_URL = process.env.SIM_WORKFLOW_URL;
  const SIM_API_KEY = process.env.SIM_API_KEY;

  if (!SIM_WORKFLOW_URL || !SIM_API_KEY) {
    return res.status(500).json({
      error: 'Server misconfiguration',
      details: 'Missing SIM_WORKFLOW_URL or SIM_API_KEY environment variables'
    });
  }

  const payload = {
    tokenAddress,
    campaignType: campaignType || 'standard',
    campaignStyle: campaignStyle || 'viral',
    userEmail: userEmail || 'anonymous',
    paymentId: paymentId || 'pending'
  };

  // timeout for upstream request
  const TIMEOUT_MS = 10000; // 10s
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(SIM_WORKFLOW_URL, {
      method: 'POST',
      headers: {
        'X-API-Key': SIM_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeout);

    // Try to parse JSON; fallback to text for diagnostics
    let resultBody;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      resultBody = await response.json();
    } else {
      resultBody = await response.text();
    }

    if (!response.ok) {
      // Upstream returned an error — surface useful info
      return res.status(502).json({
        error: 'Upstream service error',
        status: response.status,
        details: resultBody
      });
    }

    const executionId =
      (resultBody && (resultBody.executionId || resultBody.id || resultBody.execution_id)) ||
      'processing';

    return res.status(200).json({
      success: true,
      message: 'Token promotion started!',
      campaignId: executionId,
      upstream: { status: response.status }
    });
  } catch (error) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Upstream request timed out' });
    }
    return res.status(500).json({ error: 'Promotion failed', details: error.message });
  }
}
