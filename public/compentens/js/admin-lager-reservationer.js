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
        
        // Status badge
        let statusBadge = '';
        if (res.er_tilbageleveret) {
          statusBadge = '<span class="px-2 py-0.5 rounded-full text-xs font-semibold" style="background-color: #d1fae5; color: #065f46;">✓ Tilbage</span>';
        } else if (res.er_hentet) {
          statusBadge = '<span class="px-2 py-0.5 rounded-full text-xs font-semibold" style="background-color: #dbeafe; color: #1e40af;">↗ Udlånt</span>';
        } else {
          statusBadge = '<span class="px-2 py-0.5 rounded-full text-xs font-semibold" style="background-color: #fef3c7; color: #d97706;">⏳ Afventer</span>';
        }
        
        // Action knapper
        let actionButtons = '';
        if (!res.er_tilbageleveret) {
          if (!res.er_hentet) {
            actionButtons = `
              <button onclick="markerSomHentet(${res.id})" class="mt-1 px-2 py-1 rounded text-xs font-semibold transition hover:opacity-80" style="background-color: #3b82f6; color: white;">
                ✓ Hentet
              </button>
            `;
          } else {
            actionButtons = `
              <button onclick="markerSomTilbageleveret(${res.id})" class="mt-1 px-2 py-1 rounded text-xs font-semibold transition hover:opacity-80" style="background-color: #10b981; color: white;">
                ✓ Leveret tilbage
              </button>
            `;
          }
        }
        
        return `
          <div class="py-2 border-b last:border-b-0" style="border-color: #e5e7eb;">
            <div class="flex items-center justify-between mb-1">
              <p class="text-sm font-semibold" style="color: var(--color-dark);">
                ${fraDato} - ${tilDato}
              </p>
              ${statusBadge}
            </div>
            <p class="text-xs mb-1" style="color: var(--color-dark); opacity: 0.7;">
              Låner: ${res.laaner.navn} (${res.laaner.teaternavn || 'Intet teater'})
            </p>
            ${actionButtons}
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

async function markerSomHentet(reservationId) {
  if (!showConfirmDialog('Markér produktet som hentet?')) return;
  
  try {
    const response = await fetch(`/api/reservationer/${reservationId}/hentet`, {
      method: 'PATCH'
    });
    
    if (response.ok) {
      showSuccessNotification('✓ Produktet er markeret som hentet');
      loadLagerReservationer(); // Genindlæs listen
    } else {
      const data = await response.json();
      showErrorNotification(data.error || 'Fejl ved opdatering');
    }
  } catch (error) {
    console.error('Fejl:', error);
    showErrorNotification('Fejl ved opdatering');
  }
}

async function markerSomTilbageleveret(reservationId) {
  if (!showConfirmDialog('Markér produktet som tilbageleveret?')) return;
  
  try {
    const response = await fetch(`/api/reservationer/${reservationId}/tilbageleveret`, {
      method: 'PATCH'
    });
    
    if (response.ok) {
      showSuccessNotification('✓ Produktet er markeret som tilbageleveret');
      loadLagerReservationer(); // Genindlæs listen
    } else {
      const data = await response.json();
      showErrorNotification(data.error || 'Fejl ved opdatering');
    }
  } catch (error) {
    console.error('Fejl:', error);
    showErrorNotification('Fejl ved opdatering');
  }
}

// Pæn confirm dialog
function showConfirmDialog(message) {
  return confirm(message); // Browser native for nu - kan opdateres til custom modal
}

// Success notifikation
function showSuccessNotification(message) {
  showNotification(message, 'success');
}

// Error notifikation
function showErrorNotification(message) {
  showNotification(message, 'error');
}

// Generel notifikation funktion
function showNotification(message, type = 'info') {
  // Fjern eksisterende notifikationer
  const existing = document.querySelector('.status-notification');
  if (existing) existing.remove();
  
  const notification = document.createElement('div');
  notification.className = 'status-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
    font-weight: 500;
    z-index: 9999;
    animation: slideInRight 0.3s ease;
    max-width: 400px;
  `;
  
  if (type === 'success') {
    notification.style.backgroundColor = '#dcfce7';
    notification.style.color = '#065f46';
    notification.style.border = '2px solid #10b981';
  } else if (type === 'error') {
    notification.style.backgroundColor = '#fee2e2';
    notification.style.color = '#991b1b';
    notification.style.border = '2px solid #dc2626';
  } else {
    notification.style.backgroundColor = '#dbeafe';
    notification.style.color = '#1e40af';
    notification.style.border = '2px solid #3b82f6';
  }
  
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // Tilføj animation keyframes hvis ikke findes
  if (!document.getElementById('notificationStyles')) {
    const style = document.createElement('style');
    style.id = 'notificationStyles';
    style.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOutRight {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Fjern efter 3 sekunder
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
