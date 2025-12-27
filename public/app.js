async function loadPricing(){
  const el = document.getElementById('tiers');
  try{
    const res = await fetch('/api/pricing');
    const data = await res.json();
    el.innerHTML = data.tiers.map(t=>`<div class="tier"><strong>${t.id}</strong><div>$${t.priceUSD}</div><ul>${t.features.map(f=>`<li>${f}</li>`).join('')}</ul></div>`).join('');
  }catch(e){el.textContent='Failed to load pricing'}
}

async function submitPromote(ev){
  ev.preventDefault();
  const form = ev.target;
  const formData = new FormData(form);
  const body = Object.fromEntries(formData.entries());
  const resultEl = document.getElementById('result');
  resultEl.textContent = 'Processing...';
  try{
    const res = await fetch('/api/promote',{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)
    });
    const data = await res.json();
    resultEl.textContent = JSON.stringify(data,null,2);
  }catch(err){resultEl.textContent = 'Request failed: '+err.message}
}

document.getElementById('promoteForm').addEventListener('submit',submitPromote);
loadPricing();
