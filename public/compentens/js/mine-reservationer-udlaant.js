// Mine reservationer - udlånt side
document.addEventListener('DOMContentLoaded', loadReservationer);

async function loadReservationer() {
  const loadingState = document.getElementById('loadingState');
  const emptyState = document.getElementById('emptyState');
  const liste = document.getElementById('reservationerListe');
  const totalCount = document.getElementById('totalCount');
  
  try {
    const response = await fetch('/api/reservationer/mine/udlaant');
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
  
  // Status badges
  let statusBadge = '';
  if (r.er_tilbageleveret) {
    statusBadge = '<span class="px-3 py-1 rounded-full text-sm font-semibold" style="background-color: #d1fae5; color: #065f46;">✓ Tilbageleveret</span>';
  } else if (r.er_hentet) {
    statusBadge = '<span class="px-3 py-1 rounded-full text-sm font-semibold" style="background-color: #dbeafe; color: #1e40af;">↗ Udlånt</span>';
  } else {
    statusBadge = '<span class="px-3 py-1 rounded-full text-sm font-semibold" style="background-color: #fef3c7; color: #d97706;">⏳ Afventer afhentning</span>';
  }
  
  // Action knapper (kun hvis ikke tilbageleveret)
  let actionButtons = '';
  if (!r.er_tilbageleveret) {
    if (!r.er_hentet) {
      actionButtons = `
        <button onclick="markerSomHentet(${r.id})" class="px-4 py-2 rounded-lg text-sm font-semibold transition hover:opacity-80" style="background-color: #3b82f6; color: white;">
          ✓ Markér som hentet
        </button>
      `;
    } else {
      actionButtons = `
        <button onclick="markerSomTilbageleveret(${r.id})" class="px-4 py-2 rounded-lg text-sm font-semibold transition hover:opacity-80" style="background-color: #10b981; color: white;">
          ✓ Markér som tilbageleveret
        </button>
      `;
    }
  }
  
  return `
    <div class="flex items-center gap-4 p-4 rounded-xl" style="background-color: #f9fafb; border: 1px solid #e5e7eb;">
      <a href="/rekvisitter/${r.produkt?.id}" class="flex items-center gap-4 flex-grow min-w-0">
        <img src="${billede}" alt="${r.produkt?.navn}" class="w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover flex-shrink-0" onerror="this.src='/compentens/image/placeholder.webp'">
        <div class="flex-grow min-w-0">
          <div class="flex items-center gap-2 mb-1 flex-wrap">
            <h3 class="font-bold text-lg truncate" style="color: var(--color-dark);">${r.produkt?.navn || 'Ukendt produkt'}</h3>
            ${statusBadge}
          </div>
          <p class="text-sm" style="color: var(--color-dark); opacity: 0.7;">🏛️ Reserveret af: ${r.teaternavn || 'Ukendt'}</p>
          <p class="text-sm" style="color: var(--color-dark); opacity: 0.7;">📅 ${fraDato} - ${tilDato}</p>
        </div>
      </a>
      ${actionButtons}
    </div>
  `;
}

async function markerSomHentet(reservationId) {
  if (!confirm('Markér produktet som hentet?')) return;
  
  try {
    const response = await fetch(`/api/reservationer/${reservationId}/hentet`, {
      method: 'PATCH'
    });
    
    if (response.ok) {
      loadReservationer(); // Genindlæs listen
    } else {
      const data = await response.json();
      alert(data.error || 'Fejl ved opdatering');
    }
  } catch (error) {
    console.error('Fejl:', error);
    alert('Fejl ved opdatering');
  }
}

async function markerSomTilbageleveret(reservationId) {
  if (!confirm('Markér produktet som tilbageleveret?')) return;
  
  try {
    const response = await fetch(`/api/reservationer/${reservationId}/tilbageleveret`, {
      method: 'PATCH'
    });
    
    if (response.ok) {
      loadReservationer(); // Genindlæs listen
    } else {
      const data = await response.json();
      alert(data.error || 'Fejl ved opdatering');
    }
  } catch (error) {
    console.error('Fejl:', error);
    alert('Fejl ved opdatering');
  }
}
