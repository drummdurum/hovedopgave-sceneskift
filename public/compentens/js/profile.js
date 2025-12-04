// Profile page functions
document.addEventListener('DOMContentLoaded', function() {
  loadForestillingsperioderPreview();
  loadAdminStats();
});

async function logout() {
  try {
    const response = await fetch('/auth/logout', { method: 'POST' });
    if (response.ok) {
      window.location.href = '/';
    }
  } catch (error) {
    console.error('Logout fejl:', error);
  }
}

function editProfile() {
  // TODO: Implementer profil redigering
  alert('Profil redigering kommer snart!');
}

// Indlæs admin statistikker (kun hvis admin)
async function loadAdminStats() {
  const hovedlagerCount = document.getElementById('hovedlagerCount');
  const reservationerCount = document.getElementById('reservationerCount');
  
  // Hvis elementerne ikke findes, er brugeren ikke admin
  if (!hovedlagerCount || !reservationerCount) return;
  
  try {
    // Hent produkter på hovedlager
    const hovedlagerResponse = await fetch('/api/admin/hovedlager/count');
    if (hovedlagerResponse.ok) {
      const hovedlagerData = await hovedlagerResponse.json();
      hovedlagerCount.textContent = hovedlagerData.count;
    }
    
    // Hent kommende reservationer
    const reservationerResponse = await fetch('/api/admin/reservationer/count');
    if (reservationerResponse.ok) {
      const reservationerData = await reservationerResponse.json();
      reservationerCount.textContent = reservationerData.count;
    }
  } catch (error) {
    console.error('Fejl ved indlæsning af admin statistikker:', error);
  }
}

// Forestillingsperioder preview på profil
async function loadForestillingsperioderPreview() {
  const container = document.getElementById('forestillingerPreview');
  if (!container) return;
  
  try {
    const response = await fetch('/api/forestillingsperioder/mine');
    const data = await response.json();
    
    if (data.forestillingsperioder && data.forestillingsperioder.length > 0) {
      // Vis kun de første 3 som preview
      const preview = data.forestillingsperioder.slice(0, 3);
      container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          ${preview.map(f => renderPreviewKort(f)).join('')}
        </div>
        ${data.forestillingsperioder.length > 3 ? `
          <p class="text-center mt-6" style="color: var(--color-dark); opacity: 0.7;">
            + ${data.forestillingsperioder.length - 3} flere perioder. 
            <a href="/forestillingsperioder" style="color: var(--color-primary); text-decoration: underline; font-weight: 600;">Se alle →</a>
          </p>
        ` : ''}
      `;
    } else {
      container.innerHTML = `
        <div class="text-center py-8">
          <span class="text-4xl mb-4 block">🎭</span>
          <p style="color: var(--color-dark); opacity: 0.7;">Du har ingen forestillingsperioder endnu.</p>
          <a href="/forestillingsperioder" class="btn-primary inline-block mt-4" style="border-radius: 100px;">
            ➕ Opret din første periode
          </a>
        </div>
      `;
    }
  } catch (error) {
    console.error('Fejl ved indlæsning af forestillingsperioder:', error);
    container.innerHTML = '<p style="color: #dc2626;">Fejl ved indlæsning</p>';
  }
}

function renderPreviewKort(f) {
  const startDato = new Date(f.start_dato).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' });
  const slutDato = new Date(f.slut_dato).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' });
  const iDag = new Date();
  const start = new Date(f.start_dato);
  const slut = new Date(f.slut_dato);
  
  let statusBadge = '';
  if (iDag < start) {
    statusBadge = '<span class="px-2 py-1 rounded-full text-xs" style="background-color: #dbeafe; color: #2563eb;">Kommende</span>';
  } else if (iDag > slut) {
    statusBadge = '<span class="px-2 py-1 rounded-full text-xs" style="background-color: #f3f4f6; color: #6b7280;">Afsluttet</span>';
  } else {
    statusBadge = '<span class="px-2 py-1 rounded-full text-xs" style="background-color: #dcfce7; color: #16a34a;">Aktiv</span>';
  }
  
  const antalProdukter = f.produkter ? f.produkter.length : 0;
  
  return `
    <a href="/forestillingsperioder" class="block p-4 rounded-xl transition hover:shadow-lg" style="background-color: #f8f9fa; border: 1px solid #e5e7eb; text-decoration: none;">
      <div class="flex items-center justify-between mb-2">
        <h4 class="font-bold truncate" style="color: var(--color-dark);">${f.navn}</h4>
        ${statusBadge}
      </div>
      <p class="text-sm mb-1" style="color: var(--color-dark); opacity: 0.7;">
        📅 ${startDato} - ${slutDato}
      </p>
      <p class="text-sm" style="color: var(--color-dark); opacity: 0.7;">
        📦 ${antalProdukter} produkt${antalProdukter !== 1 ? 'er' : ''}
      </p>
    </a>
  `;
}
