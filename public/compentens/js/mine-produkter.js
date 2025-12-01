// Mine produkter side
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

  // Status badges (skjult og renoveres)
  let statusBadges = '';
  if (produkt.skjult) {
    statusBadges += '<span class="px-3 py-1 rounded-full text-sm" style="background-color: #fef3c7; color: #d97706;">Skjult</span>';
  }
  if (produkt.renoveres) {
    statusBadges += '<span class="px-3 py-1 rounded-full text-sm ml-1" style="background-color: #dbeafe; color: #2563eb;">🔧 Renoveres</span>';
  }

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
        <h3 class="text-xl font-bold mb-2" style="color: var(--color-dark);">${produkt.navn}</h3>
        <p class="mb-4 line-clamp-2" style="color: var(--color-dark); opacity: 0.8;">${produkt.beskrivelse}</p>
        ${showActions ? `
          <div class="flex gap-2">
            <button onclick="redigerProdukt(${produkt.id})" class="flex-1 py-2 rounded-xl text-center" style="background-color: var(--color-primary); color: white;">
              ✏️ Rediger
            </button>
            <button onclick="sletProdukt(${produkt.id})" class="py-2 px-4 rounded-xl" style="background-color: #fee2e2; color: #dc2626;">
              🗑️
            </button>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function redigerProdukt(id) {
  // TODO: Implementer redigering
  alert('Redigering kommer snart!');
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
