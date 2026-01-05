// Mine produkter side
let alleProdukter = [];

document.addEventListener('DOMContentLoaded', function() {
  loadMineProdukter();
});

async function loadMineProdukter() {
  const grid = document.getElementById('produkterGrid');
  const ingenProdukter = document.getElementById('ingenProdukter');
  
  try {
    const response = await fetch('/produkter/mine/produkter');
    const data = await response.json();
    
    if (response.ok) {
      const produkter = data.produkter;
      alleProdukter = produkter; // Gem til vælg alle funktion
      
      if (produkter.length === 0) {
        grid.innerHTML = '';
        ingenProdukter.classList.remove('hidden');
      } else {
        ingenProdukter.classList.add('hidden');
        grid.innerHTML = produkter.map(produkt => renderProduktKort(produkt, true)).join('');
      }
    } else {
      grid.innerHTML = '<p style="color: #dc2626;">Fejl ved indlæsning af produkter</p>';
    }
  } catch (error) {
    console.error('Fejl:', error);
    grid.innerHTML = '<p style="color: #dc2626;">Fejl ved indlæsning af produkter</p>';
  }
}

function renderProduktKort(produkt, showActions = false) {
  // Vis kategorier som badges
  const kategorierHtml = Array.isArray(produkt.kategorier) && produkt.kategorier.length > 0
    ? produkt.kategorier.map(kat => `
        <span class="px-2 py-1 rounded-full text-xs font-semibold mr-1" style="background-color: var(--color-secondary); color: var(--color-dark);">
          ${kat}
        </span>
      `).join('')
    : '<span class="px-2 py-1 rounded-full text-xs" style="background-color: #f3f4f6; color: #6b7280;">Ingen kategori</span>';

  // Status badges (skjult, renoveres og placering)
  let statusBadges = '';
  if (produkt.skjult) {
    statusBadges += '<span class="px-3 py-1 rounded-full text-sm" style="background-color: #fef3c7; color: #d97706;">Skjult</span>';
  }
  if (produkt.renoveres) {
    statusBadges += '<span class="px-3 py-1 rounded-full text-sm ml-1" style="background-color: #dbeafe; color: #2563eb;">🔧 Renoveres</span>';
  }
  
  // Placering badge
  const placeringBadge = produkt.paa_sceneskift 
    ? '<span class="px-3 py-1 rounded-full text-sm" style="background-color: #eff6ff; color: #2563eb;">📦 Sceneskifts lager</span>'
    : '<span class="px-3 py-1 rounded-full text-sm" style="background-color: #f0fdf4; color: #16a34a;">🏠 Eget lager</span>';

  return `
    <div class="bg-white rounded-2xl shadow-xl overflow-hidden">
      <div class="h-48 overflow-hidden relative">
        <img src="${produkt.billede_url}" alt="${produkt.navn}" class="w-full h-full object-cover">
        ${produkt.renoveres ? '<div class="absolute top-2 right-2 px-3 py-1 rounded-full text-sm font-semibold" style="background-color: #dbeafe; color: #2563eb;">🔧 Renoveres</div>' : ''}
      </div>
      <div class="p-6">
        <div class="flex items-center justify-between mb-2">
          <div class="flex flex-wrap gap-1">
            ${kategorierHtml}
          </div>
          ${produkt.skjult ? '<span class="px-3 py-1 rounded-full text-sm" style="background-color: #fef3c7; color: #d97706;">Skjult</span>' : ''}
        </div>
        <div class="mb-2">${placeringBadge}</div>
        <h3 class="text-xl font-bold mb-2" style="color: var(--color-dark);">${produkt.navn}</h3>
        <p class="mb-4 line-clamp-2" style="color: var(--color-dark); opacity: 0.8;">${produkt.beskrivelse}</p>
        ${showActions ? `
          <div class="flex flex-col gap-2">
            <button onclick="tilfoejTilKurvFraMineProdukter(${produkt.id}, '${produkt.navn.replace(/'/g, "\\'")}')", '${produkt.billede_url.replace(/'/g, "\\'")}')", 'Dig')" class="w-full py-2 rounded-xl text-center" style="background-color: var(--color-secondary); color: var(--color-dark); font-weight: 600;">
              🛒 Tilføj til kurv
            </button>
            <div class="flex gap-2">
              <button onclick="redigerProdukt(${produkt.id})" class="flex-1 py-2 rounded-xl text-center" style="background-color: var(--color-primary); color: white;">
                ✏️ Rediger
              </button>
              <button onclick="sletProdukt(${produkt.id})" class="py-2 px-4 rounded-xl" style="background-color: #fee2e2; color: #dc2626;">
                🗑️
              </button>
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function redigerProdukt(id) {
  // Åbn redigerings modal
  openRedigerModal(id);
}

// Redigerings modal
async function openRedigerModal(produktId) {
  // Hent produkt data
  try {
    const response = await fetch(`/produkter/${produktId}`);
    const data = await response.json();
    
    if (!response.ok) {
      alert('Kunne ikke hente produkt');
      return;
    }
    
    const produkt = data.produkt;
    
    // Opret modal HTML
    const modalHtml = `
      <div id="redigerModal" class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background-color: rgba(0,0,0,0.5);">
        <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold" style="color: var(--color-primary);">Rediger produkt</h2>
            <button onclick="closeRedigerModal()" class="text-2xl" style="color: var(--color-dark);">&times;</button>
          </div>
          
          <form id="redigerForm" class="space-y-4">
            <div>
              <label class="block text-sm font-semibold mb-1" style="color: var(--color-dark);">Produktnavn</label>
              <input type="text" id="redigerNavn" value="${produkt.navn}" class="w-full px-4 py-2 rounded-xl border-2" style="border-color: var(--color-primary);">
            </div>
            
            <div>
              <label class="block text-sm font-semibold mb-1" style="color: var(--color-dark);">Beskrivelse</label>
              <textarea id="redigerBeskrivelse" rows="3" class="w-full px-4 py-2 rounded-xl border-2" style="border-color: var(--color-primary);">${produkt.beskrivelse}</textarea>
            </div>
            
            <div>
              <label class="block text-sm font-semibold mb-2" style="color: var(--color-dark);">Placering</label>
              <div class="flex gap-3">
                <label class="flex-1 flex items-center gap-2 p-3 rounded-xl cursor-pointer border-2 transition" id="redigerLagerEgetLabel" style="${!produkt.paa_sceneskift ? 'border-color: var(--color-primary); background-color: #f0fdf4;' : 'border-color: #e5e7eb; background-color: #f8f9fa;'}">
                  <input type="radio" name="redigerPlacering" value="eget" id="redigerLagerEget" ${!produkt.paa_sceneskift ? 'checked' : ''} class="w-4 h-4">
                  <span>🏠 Mit eget lager</span>
                </label>
                <label class="flex-1 flex items-center gap-2 p-3 rounded-xl cursor-pointer border-2 transition" id="redigerLagerSceneskiftLabel" style="${produkt.paa_sceneskift ? 'border-color: var(--color-primary); background-color: #eff6ff;' : 'border-color: #e5e7eb; background-color: #f8f9fa;'}">
                  <input type="radio" name="redigerPlacering" value="sceneskift" id="redigerLagerSceneskift" ${produkt.paa_sceneskift ? 'checked' : ''} class="w-4 h-4">
                  <span>📦 Sceneskifts lager</span>
                </label>
              </div>
            </div>
            
            <div class="flex gap-4">
              <label class="flex items-center gap-2 p-3 rounded-xl cursor-pointer flex-1" style="background-color: #f8f9fa;">
                <input type="checkbox" id="redigerSkjult" ${produkt.skjult ? 'checked' : ''} class="w-4 h-4">
                <span style="color: var(--color-dark);">Skjul produkt</span>
              </label>
              <label class="flex items-center gap-2 p-3 rounded-xl cursor-pointer flex-1" style="background-color: #fef3c7;">
                <input type="checkbox" id="redigerRenoveres" ${produkt.renoveres ? 'checked' : ''} class="w-4 h-4">
                <span style="color: var(--color-dark);">🔧 Renoveres</span>
              </label>
            </div>
            
            <div id="redigerError" class="hidden p-3 rounded-xl" style="background-color: #fee2e2; color: #dc2626;"></div>
            
            <div class="flex gap-3 pt-4">
              <button type="button" onclick="closeRedigerModal()" class="flex-1 py-3 rounded-xl border-2" style="border-color: var(--color-primary); color: var(--color-primary);">
                Annuller
              </button>
              <button type="submit" id="redigerSubmitBtn" class="flex-1 py-3 rounded-xl font-bold" style="background-color: var(--color-primary); color: white;">
                Gem ændringer
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    // Tilføj modal til body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Tilføj styling for placering radio buttons
    const redigerLagerEget = document.getElementById('redigerLagerEget');
    const redigerLagerSceneskift = document.getElementById('redigerLagerSceneskift');
    
    function updateRedigerPlaceringStyle() {
      const egetLabel = document.getElementById('redigerLagerEgetLabel');
      const sceneskiftLabel = document.getElementById('redigerLagerSceneskiftLabel');
      if (redigerLagerEget.checked) {
        egetLabel.style.borderColor = 'var(--color-primary)';
        egetLabel.style.backgroundColor = '#f0fdf4';
        sceneskiftLabel.style.borderColor = '#e5e7eb';
        sceneskiftLabel.style.backgroundColor = '#f8f9fa';
      } else {
        sceneskiftLabel.style.borderColor = 'var(--color-primary)';
        sceneskiftLabel.style.backgroundColor = '#eff6ff';
        egetLabel.style.borderColor = '#e5e7eb';
        egetLabel.style.backgroundColor = '#f8f9fa';
      }
    }
    
    redigerLagerEget.addEventListener('change', updateRedigerPlaceringStyle);
    redigerLagerSceneskift.addEventListener('change', updateRedigerPlaceringStyle);
    
    // Form submit handler
    document.getElementById('redigerForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const errorDiv = document.getElementById('redigerError');
      const submitBtn = document.getElementById('redigerSubmitBtn');
      
      errorDiv.classList.add('hidden');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Gemmer...';
      
      const formData = new FormData();
      formData.append('navn', document.getElementById('redigerNavn').value);
      formData.append('beskrivelse', document.getElementById('redigerBeskrivelse').value);
      formData.append('skjult', document.getElementById('redigerSkjult').checked);
      formData.append('renoveres', document.getElementById('redigerRenoveres').checked);
      formData.append('paa_sceneskift', document.getElementById('redigerLagerSceneskift').checked);
      
      try {
        const response = await fetch(`/produkter/${produktId}`, {
          method: 'PUT',
          body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
          closeRedigerModal();
          loadMineProdukter();
        } else {
          errorDiv.textContent = result.error || 'Fejl ved opdatering';
          errorDiv.classList.remove('hidden');
        }
      } catch (error) {
        errorDiv.textContent = 'Netværksfejl. Prøv igen.';
        errorDiv.classList.remove('hidden');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Gem ændringer';
      }
    });
    
  } catch (error) {
    console.error('Fejl:', error);
    alert('Fejl ved hentning af produkt');
  }
}

function closeRedigerModal() {
  const modal = document.getElementById('redigerModal');
  if (modal) modal.remove();
}

async function sletProdukt(id) {
  if (!confirm('Er du sikker på at du vil slette dette produkt?')) return;
  
  try {
    const response = await fetch(`/produkter/${id}`, { method: 'DELETE' });
    
    if (response.ok) {
      loadMineProdukter();
    } else {
      alert('Fejl ved sletning af produkt');
    }
  } catch (error) {
    console.error('Fejl:', error);
    alert('Fejl ved sletning af produkt');
  }
}

// Tilføj produkt til kurv fra mine produkter
function tilfoejTilKurvFraMineProdukter(produktId, produktNavn, billede, ejer) {
  if (typeof tilfoejProduktTilKurv === 'function') {
    tilfoejProduktTilKurv({
      id: produktId,
      navn: produktNavn,
      billede: billede,
      ejer: ejer
    });
  } else {
    console.error('kurv-global.js ikke indlæst');
  }
}

// Vælg alle produkter til kurv
function vaelgAlleProdukter() {
  if (alleProdukter.length === 0) {
    showKurvNotification('Ingen produkter at tilføje', 'info');
    return;
  }
  
  let antalTilfojet = 0;
  alleProdukter.forEach(produkt => {
    const success = tilfoejProduktTilKurv({
      id: produkt.id,
      navn: produkt.navn,
      billede: produkt.billede_url,
      ejer: 'Dig'
    });
    if (success) antalTilfojet++;
  });
  
  if (antalTilfojet > 0) {
    showKurvNotification(`✅ ${antalTilfojet} produkt${antalTilfojet > 1 ? 'er' : ''} tilføjet til kurven`, 'success');
  }
}
