// Profile page functions
document.addEventListener('DOMContentLoaded', function() {
  loadMineProdukterTilCheckboxes();
  loadForestillingsperioder();
  
  // Form submit handler
  const form = document.getElementById('forestillingForm');
  if (form) {
    form.addEventListener('submit', opretForestillingsperiode);
  }
});

async function logout() {
  try {
    const response = await fetch('/auth/logout', { method: 'POST' });
    if (response.ok) {
      window.location.href = '/';
    }
  } catch (error) {
    console.error('Logout fejl:', error);
  }
}

function editProfile() {
  // TODO: Implementer profil redigering
  alert('Profil redigering kommer snart!');
}

// Forestillingsperioder funktioner
function visOpretForestilling() {
  document.getElementById('opretForestillingForm').classList.remove('hidden');
}

function skjulOpretForestilling() {
  document.getElementById('opretForestillingForm').classList.add('hidden');
  document.getElementById('forestillingForm').reset();
  // Nulstil checkboxes
  document.querySelectorAll('#produktCheckboxes input[type="checkbox"]').forEach(cb => cb.checked = false);
  document.getElementById('forestillingError').classList.add('hidden');
  document.getElementById('forestillingSuccess').classList.add('hidden');
}

async function loadMineProdukterTilCheckboxes() {
  const container = document.getElementById('produktCheckboxes');
  if (!container) return;
  
  try {
    const response = await fetch('/produkter/mine/produkter');
    const data = await response.json();
    
    if (data.produkter && data.produkter.length > 0) {
      container.innerHTML = data.produkter.map(p => `
        <label class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-gray-100">
          <input type="checkbox" name="produkter" value="${p.id}" class="w-4 h-4 rounded" style="accent-color: var(--color-primary);">
          <span class="text-sm truncate" style="color: var(--color-dark);">${p.navn}</span>
        </label>
      `).join('');
    } else {
      container.innerHTML = '<p style="color: var(--color-dark); opacity: 0.7;">Du har ingen produkter endnu.</p>';
    }
  } catch (error) {
    console.error('Fejl ved indlæsning af produkter:', error);
    container.innerHTML = '<p style="color: #dc2626;">Fejl ved indlæsning</p>';
  }
}

async function loadForestillingsperioder() {
  const container = document.getElementById('forestillingerListe');
  if (!container) return;
  
  try {
    const response = await fetch('/api/forestillingsperioder/mine');
    const data = await response.json();
    
    if (data.forestillingsperioder && data.forestillingsperioder.length > 0) {
      container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${data.forestillingsperioder.map(f => renderForestillingKort(f)).join('')}
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="text-center py-8">
          <span class="text-4xl mb-4 block">🎭</span>
          <p style="color: var(--color-dark); opacity: 0.7;">Du har ingen forestillingsperioder endnu.</p>
          <p class="text-sm mt-2" style="color: var(--color-dark); opacity: 0.5;">Tilføj en periode for at markere hvornår dine rekvisitter er i brug.</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Fejl ved indlæsning af forestillingsperioder:', error);
    container.innerHTML = '<p style="color: #dc2626;">Fejl ved indlæsning af forestillingsperioder</p>';
  }
}

function renderForestillingKort(f) {
  const startDato = new Date(f.start_dato).toLocaleDateString('da-DK');
  const slutDato = new Date(f.slut_dato).toLocaleDateString('da-DK');
  const iDag = new Date();
  const start = new Date(f.start_dato);
  const slut = new Date(f.slut_dato);
  
  let statusBadge = '';
  if (iDag < start) {
    statusBadge = '<span class="px-2 py-1 rounded-full text-xs" style="background-color: #dbeafe; color: #2563eb;">Kommende</span>';
  } else if (iDag > slut) {
    statusBadge = '<span class="px-2 py-1 rounded-full text-xs" style="background-color: #f3f4f6; color: #6b7280;">Afsluttet</span>';
  } else {
    statusBadge = '<span class="px-2 py-1 rounded-full text-xs" style="background-color: #dcfce7; color: #16a34a;">Aktiv</span>';
  }
  
  // Vis alle produkter
  const produkterHtml = f.produkter && f.produkter.length > 0
    ? f.produkter.map(p => `<span class="inline-block px-2 py-1 mr-1 mb-1 rounded text-xs" style="background-color: var(--color-secondary); color: var(--color-dark);">📦 ${p.produkt?.navn || 'Ukendt'}</span>`).join('')
    : '<span class="text-xs" style="color: var(--color-dark); opacity: 0.5;">Ingen produkter</span>';
  
  return `
    <div class="p-4 rounded-xl" style="background-color: #f8f9fa; border: 1px solid #e5e7eb;">
      <div class="flex items-center justify-between mb-2">
        <h4 class="font-bold" style="color: var(--color-dark);">${f.navn}</h4>
        ${statusBadge}
      </div>
      <div class="mb-2 flex flex-wrap">
        ${produkterHtml}
      </div>
      <p class="text-sm" style="color: var(--color-dark); opacity: 0.7;">
        📅 ${startDato} - ${slutDato}
      </p>
      <button onclick="sletForestillingsperiode(${f.id})" class="mt-3 text-sm px-3 py-1 rounded-lg" style="background-color: #fee2e2; color: #dc2626;">
        🗑️ Slet
      </button>
    </div>
  `;
}

async function opretForestillingsperiode(e) {
  e.preventDefault();
  
  const errorDiv = document.getElementById('forestillingError');
  const successDiv = document.getElementById('forestillingSuccess');
  errorDiv.classList.add('hidden');
  successDiv.classList.add('hidden');
  
  // Hent valgte produkter fra checkboxes
  const checkboxes = document.querySelectorAll('#produktCheckboxes input[type="checkbox"]:checked');
  const produkt_ids = Array.from(checkboxes).map(cb => parseInt(cb.value));
  
  if (produkt_ids.length === 0) {
    errorDiv.textContent = 'Vælg mindst ét produkt';
    errorDiv.classList.remove('hidden');
    return;
  }
  
  const data = {
    navn: document.getElementById('forestillingNavn').value,
    produkt_ids: produkt_ids,
    start_dato: document.getElementById('forestillingStart').value,
    slut_dato: document.getElementById('forestillingSlut').value
  };
  
  try {
    const response = await fetch('/api/forestillingsperioder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      successDiv.textContent = 'Forestillingsperiode oprettet!';
      successDiv.classList.remove('hidden');
      document.getElementById('forestillingForm').reset();
      document.querySelectorAll('#produktCheckboxes input[type="checkbox"]').forEach(cb => cb.checked = false);
      loadForestillingsperioder();
      setTimeout(() => skjulOpretForestilling(), 1500);
    } else {
      errorDiv.textContent = result.error || 'Der opstod en fejl';
      errorDiv.classList.remove('hidden');
    }
  } catch (error) {
    errorDiv.textContent = 'Der opstod en netværksfejl';
    errorDiv.classList.remove('hidden');
  }
}

async function sletForestillingsperiode(id) {
  if (!confirm('Er du sikker på at du vil slette denne forestillingsperiode?')) return;
  
  try {
    const response = await fetch(`/api/forestillingsperioder/${id}`, { method: 'DELETE' });
    
    if (response.ok) {
      loadForestillingsperioder();
    } else {
      alert('Fejl ved sletning af forestillingsperiode');
    }
  } catch (error) {
    console.error('Fejl:', error);
    alert('Fejl ved sletning af forestillingsperiode');
  }
}
