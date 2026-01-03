// Mine reservationer - hente side
document.addEventListener('DOMContentLoaded', loadReservationer);

async function loadReservationer() {
  const loadingState = document.getElementById('loadingState');
  const emptyState = document.getElementById('emptyState');
  const liste = document.getElementById('reservationerListe');
  const totalCount = document.getElementById('totalCount');
  
  try {
    const response = await fetch('/api/reservationer/mine/hente');
    const data = await response.json();
    
    loadingState.classList.add('hidden');
    totalCount.textContent = data.count || 0;
    
    if (!data.reservationer || data.reservationer.length === 0) {
      emptyState.classList.remove('hidden');
      return;
    }
    
    liste.classList.remove('hidden');
    liste.innerHTML = data.reservationer.map(r => renderReservation(r)).join('');
    
  } catch (error) {
    console.error('Fejl:', error);
    loadingState.innerHTML = '<p style="color: #dc2626;">Fejl ved indlæsning</p>';
  }
}

function renderReservation(r) {
  const fraDato = new Date(r.fra_dato).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' });
  const tilDato = new Date(r.til_dato).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' });
  const billede = r.produkt?.billede_url || '/compentens/image/placeholder.webp';
  const ejer = r.produkt?.ejer?.teaternavn || 'Ukendt';
  
  // Status badges
  let statusBadge = '';
  if (r.er_tilbageleveret) {
    statusBadge = '<span class="px-3 py-1 rounded-full text-sm font-semibold" style="background-color: #d1fae5; color: #065f46;">✓ Afleveret</span>';
  } else if (r.er_hentet) {
    statusBadge = '<span class="px-3 py-1 rounded-full text-sm font-semibold" style="background-color: #dbeafe; color: #1e40af;">✓ Hentet</span>';
  } else {
    statusBadge = '<span class="px-3 py-1 rounded-full text-sm font-semibold" style="background-color: #fef3c7; color: #d97706;">⏳ Skal hentes</span>';
  }
  
  return `
    <a href="/rekvisitter/${r.produkt?.id}" class="flex items-center gap-4 p-4 rounded-xl hover:shadow-lg transition" style="background-color: #f9fafb; border: 1px solid #e5e7eb;">
      <img src="${billede}" alt="${r.produkt?.navn}" class="w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover flex-shrink-0" onerror="this.src='/compentens/image/placeholder.webp'">
      <div class="flex-grow min-w-0">
        <div class="flex items-center gap-2 mb-1 flex-wrap">
          <h3 class="font-bold text-lg truncate" style="color: var(--color-dark);">${r.produkt?.navn || 'Ukendt produkt'}</h3>
          ${statusBadge}
        </div>
        <p class="text-sm" style="color: var(--color-dark); opacity: 0.7;">🏛️ Ejes af: ${ejer}</p>
        <p class="text-sm" style="color: var(--color-dark); opacity: 0.7;">📅 ${fraDato} - ${tilDato}</p>
      </div>
      <span class="text-2xl">→</span>
    </a>
  `;
}
