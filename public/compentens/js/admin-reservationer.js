// Admin reservationer side
document.addEventListener('DOMContentLoaded', loadReservationer);

async function loadReservationer() {
  const liste = document.getElementById('reservationerListe');
  const ingenReservationer = document.getElementById('ingenReservationer');
  const countSpan = document.getElementById('reservationerCount');
  
  try {
    const response = await fetch('/api/admin/reservationer');
    const data = await response.json();
    
    if (response.ok) {
      const reservationer = data.reservationer;
      countSpan.textContent = `(${reservationer.length})`;
      
      if (reservationer.length === 0) {
        liste.innerHTML = '';
        ingenReservationer.classList.remove('hidden');
      } else {
        ingenReservationer.classList.add('hidden');
        liste.innerHTML = reservationer.map(res => renderReservation(res)).join('');
      }
    } else {
      liste.innerHTML = '<p style="color: #dc2626;">Fejl ved indlæsning af reservationer</p>';
    }
  } catch (error) {
    console.error('Fejl:', error);
    liste.innerHTML = '<p style="color: #dc2626;">Fejl ved indlæsning af reservationer</p>';
  }
}

function renderReservation(reservation) {
  const fraDato = new Date(reservation.fra_dato).toLocaleDateString('da-DK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const tilDato = new Date(reservation.til_dato).toLocaleDateString('da-DK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  
  const billedeUrl = reservation.produkt.billeder && reservation.produkt.billeder.length > 0 
    ? reservation.produkt.billeder[0].billede_url 
    : reservation.produkt.billede_url || '/compentens/image/placeholder.webp';

  // Beregn antal dage til reservation
  const dagesTil = Math.ceil((new Date(reservation.fra_dato) - new Date()) / (1000 * 60 * 60 * 24));
  let statusBadge = '';
  if (dagesTil <= 7) {
    statusBadge = '<span class="px-3 py-1 rounded-full text-sm font-semibold" style="background-color: #fef3c7; color: #d97706;">Snart</span>';
  } else if (dagesTil <= 30) {
    statusBadge = '<span class="px-3 py-1 rounded-full text-sm font-semibold" style="background-color: #dbeafe; color: #2563eb;">Om ' + dagesTil + ' dage</span>';
  }

  return `
    <div class="flex items-center gap-6 p-6 rounded-xl" style="background-color: #f8f9fa;">
      <img src="${billedeUrl}" alt="${reservation.produkt.navn}" class="w-24 h-24 object-cover rounded-xl">
      
      <div class="flex-grow">
        <div class="flex items-center gap-3 mb-2">
          <h3 class="text-xl font-bold" style="color: var(--color-dark);">${reservation.produkt.navn}</h3>
          ${statusBadge}
        </div>
        <p class="mb-1" style="color: var(--color-dark); opacity: 0.7;">
          <strong>Periode:</strong> ${fraDato} - ${tilDato}
        </p>
        <p class="mb-1" style="color: var(--color-dark); opacity: 0.7;">
          <strong>Reserveret af:</strong> ${reservation.bruger} (${reservation.teaternavn})
        </p>
        <p style="color: var(--color-dark); opacity: 0.7;">
          <strong>Ejer:</strong> ${reservation.produkt.ejer.navn} - ${reservation.produkt.ejer.teaternavn}
        </p>
      </div>
      
      <div class="text-right">
        <div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2" style="background-color: #eff6ff;">
          <span class="text-2xl">📅</span>
        </div>
        <p class="text-sm font-semibold" style="color: var(--color-primary);">
          ${dagesTil > 0 ? 'Om ' + dagesTil + ' dage' : 'I dag'}
        </p>
      </div>
    </div>
  `;
}
