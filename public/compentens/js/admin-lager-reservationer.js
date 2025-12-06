// Admin lager-reservationer side
document.addEventListener('DOMContentLoaded', loadLagerReservationer);

async function loadLagerReservationer() {
  const grid = document.getElementById('produkterGrid');
  const ingenProdukter = document.getElementById('ingenProdukter');
  const countSpan = document.getElementById('produkterCount');
  
  try {
    const response = await fetch('/api/admin/lager-reservationer');
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
  const billedeUrl = produkt.billeder && produkt.billeder.length > 0 
    ? produkt.billeder[0].url 
    : produkt.billede_url || '/compentens/image/placeholder.webp';

  // Render reservationer
  const reservationerHtml = produkt.reservationer && produkt.reservationer.length > 0
    ? produkt.reservationer.map(res => {
        const fraDato = new Date(res.fra_dato).toLocaleDateString('da-DK');
        const tilDato = new Date(res.til_dato).toLocaleDateString('da-DK');
        return `
          <div class="py-2 border-b last:border-b-0" style="border-color: #e5e7eb;">
            <p class="text-sm font-semibold" style="color: var(--color-dark);">
              ${fraDato} - ${tilDato}
            </p>
            <p class="text-xs" style="color: var(--color-dark); opacity: 0.7;">
              Låner: ${res.laaner.navn} (${res.laaner.teaternavn || 'Intet teater'})
            </p>
          </div>
        `;
      }).join('')
    : '<p class="text-sm" style="color: var(--color-dark); opacity: 0.7;">Ingen reservationer</p>';

  return `
    <div class="bg-white rounded-2xl shadow-lg overflow-hidden border" style="border-color: #e5e7eb;">
      <div class="h-48 overflow-hidden relative">
        <img src="${billedeUrl}" alt="${produkt.navn}" class="w-full h-full object-cover">
        <div class="absolute top-2 right-2 px-3 py-1 rounded-full text-sm font-semibold" style="background-color: #dcfce7; color: #166534;">
          📦 ${produkt.reservationer.length} reservation${produkt.reservationer.length !== 1 ? 'er' : ''}
        </div>
      </div>
      <div class="p-5">
        <h3 class="text-lg font-bold mb-2" style="color: var(--color-dark);">${produkt.navn}</h3>
        <p class="text-sm mb-3 line-clamp-2" style="color: var(--color-dark); opacity: 0.8;">${produkt.beskrivelse}</p>
        
        <div class="pt-3 border-t mb-3" style="border-color: #e5e7eb;">
          <p class="text-sm" style="color: var(--color-dark); opacity: 0.7;">
            <strong>Ejer:</strong> ${produkt.ejer.navn}
          </p>
          <p class="text-sm" style="color: var(--color-dark); opacity: 0.7;">
            <strong>Teater:</strong> ${produkt.ejer.teaternavn || 'Intet teater'}
          </p>
        </div>
        
        <div class="pt-3 border-t" style="border-color: #e5e7eb;">
          <p class="text-sm font-semibold mb-2" style="color: var(--color-primary);">
            Kommende reservationer:
          </p>
          <div class="max-h-32 overflow-y-auto">
            ${reservationerHtml}
          </div>
        </div>
      </div>
    </div>
  `;
}
