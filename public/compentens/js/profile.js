// Profile page functions
document.addEventListener('DOMContentLoaded', function() {
  loadForestillingsperioderPreview();
  loadAdminStats();
  loadReservationStats();
  
  // Håndter profil formular
  const form = document.getElementById('editProfileForm');
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const errorDiv = document.getElementById('editProfileError');
      const successDiv = document.getElementById('editProfileSuccess');
      errorDiv.classList.add('hidden');
      successDiv.classList.add('hidden');
      
      const formData = {
        navn: document.getElementById('editNavn').value.trim(),
        teaternavn: document.getElementById('editTeaternavn').value.trim(),
        lokation: document.getElementById('editLokation').value.trim(),
        email: document.getElementById('editEmail').value.trim()
      };
      
      try {
        const response = await fetch('/auth/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
          successDiv.textContent = 'Profil opdateret!';
          successDiv.classList.remove('hidden');
          
          // Genindlæs siden efter 1 sekund for at vise opdaterede data
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          errorDiv.textContent = data.error || 'Der opstod en fejl';
          errorDiv.classList.remove('hidden');
        }
      } catch (error) {
        console.error('Fejl ved opdatering af profil:', error);
        errorDiv.textContent = 'Der opstod en netværksfejl. Prøv igen.';
        errorDiv.classList.remove('hidden');
      }
    });
  }
  
  // Luk modal ved klik udenfor
  const modal = document.getElementById('editProfileModal');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        closeEditProfile();
      }
    });
  }
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

// Åbn rediger profil modal
function editProfile() {
  const modal = document.getElementById('editProfileModal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
  }
}

// Luk rediger profil modal
function closeEditProfile() {
  const modal = document.getElementById('editProfileModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
    // Nulstil fejl/success beskeder
    document.getElementById('editProfileError').classList.add('hidden');
    document.getElementById('editProfileSuccess').classList.add('hidden');
  }
}

// Indlæs reservations statistikker for normal bruger
async function loadReservationStats() {
  const henteCount = document.getElementById('henteCount');
  const udlaantCount = document.getElementById('udlaantCount');
  
  // Hvis elementerne ikke findes, skip
  if (!henteCount && !udlaantCount) return;
  
  try {
    // Hent produkter brugeren skal hente
    if (henteCount) {
      const henteResponse = await fetch('/api/reservationer/mine/hente');
      if (henteResponse.ok) {
        const henteData = await henteResponse.json();
        henteCount.textContent = henteData.count || 0;
      }
    }
    
    // Hent brugerens produkter der er reserveret
    if (udlaantCount) {
      const udlaantResponse = await fetch('/api/reservationer/mine/udlaant');
      if (udlaantResponse.ok) {
        const udlaantData = await udlaantResponse.json();
        udlaantCount.textContent = udlaantData.count || 0;
      }
    }
  } catch (error) {
    console.error('Fejl ved indlæsning af reservation statistikker:', error);
  }
}

// Indlæs admin statistikker (kun hvis admin)
async function loadAdminStats() {
  const hovedlagerCount = document.getElementById('hovedlagerCount');
  const reservationerCount = document.getElementById('reservationerCount');
  const lagerReservationerCount = document.getElementById('lagerReservationerCount');
  
  if (!hovedlagerCount && !reservationerCount && !lagerReservationerCount) return;
  
  try {
    if (hovedlagerCount) {
      const hovedlagerResponse = await fetch('/api/admin/hovedlager/count');
      if (hovedlagerResponse.ok) {
        const hovedlagerData = await hovedlagerResponse.json();
        hovedlagerCount.textContent = hovedlagerData.count;
      }
    }
    
    if (reservationerCount) {
      const reservationerResponse = await fetch('/api/admin/reservationer/count');
      if (reservationerResponse.ok) {
        const reservationerData = await reservationerResponse.json();
        reservationerCount.textContent = reservationerData.count;
      }
    }
    
    if (lagerReservationerCount) {
      const lagerResponse = await fetch('/api/admin/lager-reservationer/count');
      if (lagerResponse.ok) {
        const lagerData = await lagerResponse.json();
        lagerReservationerCount.textContent = lagerData.count;
      }
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
