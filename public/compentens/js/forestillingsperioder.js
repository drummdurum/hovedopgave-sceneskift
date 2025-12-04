// Forestillingsperioder page functions
let mineProdukter = [];
let redigeringsMode = false;

document.addEventListener('DOMContentLoaded', function() {
  loadMineProdukter();
  loadForestillingsperioder();
  
  document.getElementById('periodeForm').addEventListener('submit', gemPeriode);
});

async function loadMineProdukter() {
  try {
    const response = await fetch('/produkter/mine/produkter');
    const data = await response.json();
    mineProdukter = data.produkter || [];
    renderProduktCheckboxes([]);
  } catch (error) {
    console.error('Fejl ved indlæsning af produkter:', error);
  }
}

function renderProduktCheckboxes(selectedIds) {
  const container = document.getElementById('produktCheckboxes');
  if (!container) return;
  
  if (mineProdukter.length === 0) {
    container.innerHTML = '<p style="color: var(--color-dark); opacity: 0.7;">Du har ingen produkter endnu. Du kan tilføje produkter senere. <a href="/produkter/opret" style="color: var(--color-primary); text-decoration: underline;">Opret et produkt</a></p>';
    return;
  }
  
  container.innerHTML = `
    <p class="text-sm mb-2" style="color: var(--color-dark); opacity: 0.7;">Vælg produkter (valgfrit - du kan tilføje senere)</p>
  ` + mineProdukter.map(p => `
    <label class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-white transition">
      <input type="checkbox" name="produkter" value="${p.id}" ${selectedIds.includes(p.id) ? 'checked' : ''} 
        class="w-5 h-5 rounded" style="accent-color: var(--color-primary);">
      <span class="text-sm" style="color: var(--color-dark);">${p.navn}</span>
    </label>
  `).join('');
}

async function loadForestillingsperioder() {
  const container = document.getElementById('perioderListe');
  
  try {
    const response = await fetch('/api/forestillingsperioder/mine');
    const data = await response.json();
    
    if (data.forestillingsperioder && data.forestillingsperioder.length > 0) {
      container.innerHTML = `
        <div class="space-y-4">
          ${data.forestillingsperioder.map(f => renderPeriodeKort(f)).join('')}
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="text-center py-12">
          <span class="text-6xl mb-4 block">🎭</span>
          <h3 class="text-xl mb-2" style="font-family: var(--font-heading); color: var(--color-primary);">Ingen forestillingsperioder</h3>
          <p style="color: var(--color-dark); opacity: 0.7;">Du har ikke oprettet nogen forestillingsperioder endnu.</p>
          <button onclick="visOpretModal()" class="btn-primary mt-6" style="border-radius: 100px;">
            ➕ Opret din første periode
          </button>
        </div>
      `;
    }
  } catch (error) {
    console.error('Fejl ved indlæsning:', error);
    container.innerHTML = '<p style="color: #dc2626;">Fejl ved indlæsning af forestillingsperioder</p>';
  }
}

function renderPeriodeKort(f) {
  const startDato = new Date(f.start_dato).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' });
  const slutDato = new Date(f.slut_dato).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' });
  const iDag = new Date();
  const start = new Date(f.start_dato);
  const slut = new Date(f.slut_dato);
  
  let statusBadge = '';
  let statusColor = '';
  if (iDag < start) {
    statusBadge = 'Kommende';
    statusColor = 'background-color: #dbeafe; color: #2563eb;';
  } else if (iDag > slut) {
    statusBadge = 'Afsluttet';
    statusColor = 'background-color: #f3f4f6; color: #6b7280;';
  } else {
    statusBadge = 'Aktiv';
    statusColor = 'background-color: #dcfce7; color: #16a34a;';
  }
  
  // Produkter badges
  const produkterHtml = f.produkter && f.produkter.length > 0
    ? f.produkter.map(p => `
        <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm" style="background-color: var(--color-secondary); color: var(--color-dark);">
          📦 ${p.produkt?.navn || 'Ukendt'}
        </span>
      `).join('')
    : '<span class="text-sm" style="color: var(--color-dark); opacity: 0.5;">Ingen produkter tilknyttet</span>';
  
  return `
    <div class="p-6 rounded-xl transition hover:shadow-lg" style="background-color: #f8f9fa; border: 1px solid #e5e7eb;">
      <div class="flex items-start justify-between mb-4">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <h3 class="text-xl font-bold" style="color: var(--color-dark);">${f.navn}</h3>
            <span class="px-3 py-1 rounded-full text-sm font-medium" style="${statusColor}">${statusBadge}</span>
          </div>
          <p class="text-sm" style="color: var(--color-dark); opacity: 0.7;">
            📅 ${startDato} — ${slutDato}
          </p>
        </div>
        <div class="flex gap-2">
          <button onclick='redigerPeriode(${JSON.stringify(f).replace(/'/g, "&#39;")})' class="px-4 py-2 rounded-lg text-sm font-medium transition" style="background-color: var(--color-primary); color: white;">
            ✏️ Rediger
          </button>
          <button onclick="sletPeriode(${f.id})" class="px-4 py-2 rounded-lg text-sm font-medium transition" style="background-color: #fee2e2; color: #dc2626;">
            🗑️ Slet
          </button>
        </div>
      </div>
      
      <div class="pt-4 border-t" style="border-color: #e5e7eb;">
        <p class="text-sm mb-2 font-medium" style="color: var(--color-dark);">Tilknyttede produkter:</p>
        <div class="flex flex-wrap gap-2">
          ${produkterHtml}
        </div>
      </div>
    </div>
  `;
}

function visOpretModal() {
  redigeringsMode = false;
  document.getElementById('modalTitle').textContent = 'Ny forestillingsperiode';
  document.getElementById('submitBtn').textContent = 'Opret periode';
  document.getElementById('periodeId').value = '';
  document.getElementById('periodeForm').reset();
  renderProduktCheckboxes([]);
  skjulFeedback();
  document.getElementById('periodeModal').classList.remove('hidden');
}

function redigerPeriode(f) {
  redigeringsMode = true;
  document.getElementById('modalTitle').textContent = 'Rediger forestillingsperiode';
  document.getElementById('submitBtn').textContent = 'Gem ændringer';
  document.getElementById('periodeId').value = f.id;
  document.getElementById('periodeNavn').value = f.navn;
  document.getElementById('periodeStart').value = f.start_dato.split('T')[0];
  document.getElementById('periodeSlut').value = f.slut_dato.split('T')[0];
  
  // Vælg de produkter der allerede er tilknyttet
  const selectedIds = f.produkter ? f.produkter.map(p => p.produkt?.id || p.produkt_id) : [];
  renderProduktCheckboxes(selectedIds);
  
  skjulFeedback();
  document.getElementById('periodeModal').classList.remove('hidden');
}

function skjulModal() {
  document.getElementById('periodeModal').classList.add('hidden');
}

function skjulFeedback() {
  document.getElementById('formError').classList.add('hidden');
  document.getElementById('formSuccess').classList.add('hidden');
}

async function gemPeriode(e) {
  e.preventDefault();
  skjulFeedback();
  
  const checkboxes = document.querySelectorAll('#produktCheckboxes input[type="checkbox"]:checked');
  const produkt_ids = Array.from(checkboxes).map(cb => parseInt(cb.value));
  
  const data = {
    navn: document.getElementById('periodeNavn').value,
    produkt_ids: produkt_ids, // Kan være tomt array
    start_dato: document.getElementById('periodeStart').value,
    slut_dato: document.getElementById('periodeSlut').value
  };
  
  const periodeId = document.getElementById('periodeId').value;
  const url = redigeringsMode ? `/api/forestillingsperioder/${periodeId}` : '/api/forestillingsperioder';
  const method = redigeringsMode ? 'PUT' : 'POST';
  
  try {
    const response = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      document.getElementById('formSuccess').textContent = redigeringsMode ? 'Periode opdateret!' : 'Periode oprettet!';
      document.getElementById('formSuccess').classList.remove('hidden');
      loadForestillingsperioder();
      setTimeout(() => skjulModal(), 1000);
    } else {
      document.getElementById('formError').textContent = result.error || 'Der opstod en fejl';
      document.getElementById('formError').classList.remove('hidden');
    }
  } catch (error) {
    document.getElementById('formError').textContent = 'Der opstod en netværksfejl';
    document.getElementById('formError').classList.remove('hidden');
  }
}

async function sletPeriode(id) {
  if (!confirm('Er du sikker på at du vil slette denne forestillingsperiode?')) return;
  
  try {
    const response = await fetch(`/api/forestillingsperioder/${id}`, { method: 'DELETE' });
    
    if (response.ok) {
      loadForestillingsperioder();
    } else {
      const result = await response.json();
      alert(result.error || 'Fejl ved sletning');
    }
  } catch (error) {
    console.error('Fejl:', error);
    alert('Fejl ved sletning af forestillingsperiode');
  }
}
