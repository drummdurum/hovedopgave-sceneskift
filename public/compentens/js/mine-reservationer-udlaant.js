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
  showConfirmDialog(
    'Markér som hentet?',
    'Bekræft at produktet er blevet hentet af låneren.',
    async () => {
      try {
        const response = await fetch(`/api/reservationer/${reservationId}/hentet`, {
          method: 'PATCH'
        });
        
        if (response.ok) {
          showSuccessNotification('✓ Produktet er markeret som hentet');
          loadReservationer(); // Genindlæs listen
        } else {
          const data = await response.json();
          showErrorNotification(data.error || 'Fejl ved opdatering');
        }
      } catch (error) {
        console.error('Fejl:', error);
        showErrorNotification('Fejl ved opdatering');
      }
    }
  );
}

async function markerSomTilbageleveret(reservationId) {
  showConfirmDialog(
    'Markér som tilbageleveret?',
    'Bekræft at produktet er blevet returneret.',
    async () => {
      try {
        const response = await fetch(`/api/reservationer/${reservationId}/tilbageleveret`, {
          method: 'PATCH'
        });
        
        if (response.ok) {
          showSuccessNotification('✓ Produktet er markeret som tilbageleveret');
          loadReservationer(); // Genindlæs listen
        } else {
          const data = await response.json();
          showErrorNotification(data.error || 'Fejl ved opdatering');
        }
      } catch (error) {
        console.error('Fejl:', error);
        showErrorNotification('Fejl ved opdatering');
      }
    }
  );
}

// Pæn confirm dialog
function showConfirmDialog(title, message, onConfirm) {
  // Fjern eksisterende dialog hvis der er en
  const existing = document.getElementById('confirmDialog');
  if (existing) existing.remove();
  
  const dialog = document.createElement('div');
  dialog.id = 'confirmDialog';
  dialog.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  `;
  
  dialog.innerHTML = `
    <div class="confirm-backdrop" style="position: absolute; inset: 0; background-color: rgba(0,0,0,0.5); animation: fadeIn 0.2s ease;"></div>
    <div class="confirm-content" style="position: relative; background: white; border-radius: 1rem; padding: 2rem; max-width: 400px; width: 100%; box-shadow: 0 20px 50px rgba(0,0,0,0.3); animation: scaleIn 0.3s ease;">
      <h3 style="font-size: 1.5rem; font-weight: bold; color: var(--color-primary); margin-bottom: 0.75rem; font-family: var(--font-heading);">${title}</h3>
      <p style="color: var(--color-dark); opacity: 0.8; margin-bottom: 1.5rem; line-height: 1.6;">${message}</p>
      <div style="display: flex; gap: 0.75rem;">
        <button id="confirmCancel" style="flex: 1; padding: 0.75rem; border-radius: 0.75rem; border: 2px solid var(--color-primary); color: var(--color-primary); font-weight: 600; background: white; cursor: pointer; transition: all 0.2s;">
          Annuller
        </button>
        <button id="confirmOk" style="flex: 1; padding: 0.75rem; border-radius: 0.75rem; border: none; background-color: var(--color-primary); color: white; font-weight: 600; cursor: pointer; transition: all 0.2s;">
          Bekræft
        </button>
      </div>
    </div>
  `;
  
  // Tilføj animations
  if (!document.getElementById('confirmDialogStyles')) {
    const style = document.createElement('style');
    style.id = 'confirmDialogStyles';
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes scaleIn {
        from { transform: scale(0.9); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      #confirmOk:hover {
        opacity: 0.9;
        transform: translateY(-1px);
      }
      #confirmCancel:hover {
        background-color: var(--color-primary);
        color: white;
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(dialog);
  
  // Event handlers
  const closeDialog = () => dialog.remove();
  
  dialog.querySelector('#confirmCancel').addEventListener('click', closeDialog);
  dialog.querySelector('.confirm-backdrop').addEventListener('click', closeDialog);
  dialog.querySelector('#confirmOk').addEventListener('click', () => {
    closeDialog();
    if (onConfirm) onConfirm();
  });
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
