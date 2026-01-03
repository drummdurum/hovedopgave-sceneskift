// Admin hovedlager side
document.addEventListener('DOMContentLoaded', loadHovedlagerProdukter);

async function loadHovedlagerProdukter() {
  const grid = document.getElementById('produkterGrid');
  const ingenProdukter = document.getElementById('ingenProdukter');
  const countSpan = document.getElementById('produkterCount');
  
  try {
    const response = await fetch('/api/admin/hovedlager');
    const data = await response.json();
    
    if (response.ok) {
      const produkter = data.produkter;
      countSpan.textContent = `(${produkter.length})`;
      
      if (produkter.length === 0) {
        grid.innerHTML = '';
        ingenProdukter.classList.remove('hidden');
      } else {
        ingenProdukter.classList.add('hidden');
        grid.innerHTML = produkter.map(produkt => renderProduktKort(produkt)).join('');
      }
    } else {
      grid.innerHTML = '<p style="color: #dc2626;">Fejl ved indlæsning af produkter</p>';
    }
  } catch (error) {
    console.error('Fejl:', error);
    grid.innerHTML = '<p style="color: #dc2626;">Fejl ved indlæsning af produkter</p>';
  }
}

function renderProduktKort(produkt) {
  const kategorierHtml = Array.isArray(produkt.kategorier) && produkt.kategorier.length > 0
    ? produkt.kategorier.map(kat => `
        <span class="px-2 py-1 rounded-full text-xs font-semibold mr-1" style="background-color: var(--color-secondary); color: var(--color-dark);">
          ${kat}
        </span>
      `).join('')
    : '';

  const billedeUrl = produkt.billeder && produkt.billeder.length > 0 
    ? produkt.billeder[0].url 
    : produkt.billede_url || '/compentens/image/placeholder.webp';

  return `
    <div class="bg-white rounded-2xl shadow-lg overflow-hidden border cursor-pointer transition transform hover:scale-105" style="border-color: #e5e7eb;" onclick="visProdukt(${produkt.id})">
      <div class="h-48 overflow-hidden relative">
        <img src="${billedeUrl}" alt="${produkt.navn}" class="w-full h-full object-cover">
        <div class="absolute top-2 right-2 px-3 py-1 rounded-full text-sm font-semibold" style="background-color: #eff6ff; color: #2563eb;">
          📦 Hovedlager
        </div>
      </div>
      <div class="p-5">
        <div class="flex flex-wrap gap-1 mb-2">
          ${kategorierHtml}
        </div>
        <h3 class="text-lg font-bold mb-2" style="color: var(--color-dark);">${produkt.navn}</h3>
        <p class="text-sm mb-3 line-clamp-2" style="color: var(--color-dark); opacity: 0.8;">${produkt.beskrivelse}</p>
        
        <div class="pt-3 border-t" style="border-color: #e5e7eb;">
          <p class="text-sm" style="color: var(--color-dark); opacity: 0.7;">
            <strong>Ejer:</strong> ${produkt.ejer.navn}
          </p>
          <p class="text-sm" style="color: var(--color-dark); opacity: 0.7;">
            <strong>Teater:</strong> ${produkt.ejer.teaternavn}
          </p>
        </div>
      </div>
    </div>
  `;
}

function visProdukt(id) {
  // Gem den aktuelle side i sessionStorage så vi kan komme tilbage
  sessionStorage.setItem('returSide', '/admin/hovedlager');
  window.location.href = `/rekvisitter/${id}`;
}
