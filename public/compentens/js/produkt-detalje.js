// Produkt detalje side
let produkt = null;
let currentImageIndex = 0;
let billeder = [];

document.addEventListener('DOMContentLoaded', function() {
  loadProdukt();
  updateKurvBadge();
});

async function loadProdukt() {
  const loadingState = document.getElementById('loadingState');
  const errorState = document.getElementById('errorState');
  const produktContent = document.getElementById('produktContent');
  
  try {
    const response = await fetch(`/produkter/${produktId}`);
    const data = await response.json();
    
    if (!response.ok || !data.produkt) {
      loadingState.classList.add('hidden');
      errorState.classList.remove('hidden');
      return;
    }
    
    produkt = data.produkt;
    renderProdukt();
    
    loadingState.classList.add('hidden');
    produktContent.classList.remove('hidden');
    
  } catch (error) {
    console.error('Fejl ved indlæsning af produkt:', error);
    loadingState.classList.add('hidden');
    errorState.classList.remove('hidden');
  }
}

function renderProdukt() {
  // Titel i hero
  document.getElementById('produktNavnHero').textContent = produkt.navn;
  document.title = `${produkt.navn} - SceneSkift`;
  
  // Produkt navn
  document.getElementById('produktNavn').textContent = produkt.navn;
  
  // Beskrivelse
  document.getElementById('produktBeskrivelse').textContent = produkt.beskrivelse;
  
  // Kategorier
  const kategorierContainer = document.getElementById('kategorierContainer');
  if (produkt.kategorier && produkt.kategorier.length > 0) {
    kategorierContainer.innerHTML = produkt.kategorier.map(kat => `
      <span class="px-3 py-1 rounded-full text-sm font-semibold" style="background-color: var(--color-secondary); color: var(--color-dark);">
        ${kat}
      </span>
    `).join('');
  } else {
    kategorierContainer.innerHTML = `
      <span class="px-3 py-1 rounded-full text-sm" style="background-color: #f3f4f6; color: #6b7280;">
        Ingen kategori
      </span>
    `;
  }
  
  // Status badges
  const statusBadges = document.getElementById('statusBadges');
  let badgesHtml = '';
  
  if (produkt.renoveres) {
    badgesHtml += '<span class="status-badge status-renoveres">🔧 Renoveres</span>';
  }
  
  if (produkt.paa_sceneskift) {
    badgesHtml += '<span class="status-badge status-sceneskift">📦 På Sceneskifts lager</span>';
  }
  
  statusBadges.innerHTML = badgesHtml;
  
  // Billeder
  setupGallery();
  
  // Ejer info
  renderEjerInfo();
  
  // Detaljer
  renderDetails();
  
  // Reservationer
  renderReservationer();
  
  // Tjek om produktet allerede er i kurven
  updateKurvButtons();
}

function setupGallery() {
  // Saml billeder fra både det gamle felt og det nye billeder array
  billeder = [];
  
  if (produkt.billeder && produkt.billeder.length > 0) {
    billeder = produkt.billeder.map(b => b.url);
  } else if (produkt.billede_url) {
    billeder = [produkt.billede_url];
  }
  
  if (billeder.length === 0) {
    billeder = ['/compentens/image/placeholder.webp'];
  }
  
  // Vis første billede
  const mainImage = document.getElementById('mainImage');
  mainImage.src = billeder[0];
  mainImage.alt = produkt.navn;
  
  // Skjul navigation hvis kun ét billede
  const navButtons = document.querySelectorAll('.gallery-nav');
  navButtons.forEach(btn => {
    btn.style.display = billeder.length > 1 ? 'flex' : 'none';
  });
  
  // Generer thumbnails
  const thumbnailsContainer = document.getElementById('galleryThumbnails');
  if (billeder.length > 1) {
    thumbnailsContainer.innerHTML = billeder.map((url, index) => `
      <div class="gallery-thumb ${index === 0 ? 'active' : ''}" onclick="goToImage(${index})">
        <img src="${url}" alt="${produkt.navn} billede ${index + 1}">
      </div>
    `).join('');
  } else {
    thumbnailsContainer.innerHTML = '';
  }
}

function goToImage(index) {
  currentImageIndex = index;
  updateGallery();
}

function prevImage() {
  currentImageIndex = (currentImageIndex - 1 + billeder.length) % billeder.length;
  updateGallery();
}

function nextImage() {
  currentImageIndex = (currentImageIndex + 1) % billeder.length;
  updateGallery();
}

function updateGallery() {
  const mainImage = document.getElementById('mainImage');
  mainImage.src = billeder[currentImageIndex];
  
  // Opdater aktiv thumbnail
  const thumbs = document.querySelectorAll('.gallery-thumb');
  thumbs.forEach((thumb, index) => {
    thumb.classList.toggle('active', index === currentImageIndex);
  });
}

function renderEjerInfo() {
  const ejerInfo = document.getElementById('ejerInfo');
  
  if (!produkt.ejer) {
    ejerInfo.innerHTML = '<p style="color: var(--color-dark); opacity: 0.7;">Ingen ejer information</p>';
    return;
  }
  
  ejerInfo.innerHTML = `
    <div class="w-14 h-14 rounded-full flex items-center justify-center" style="background-color: var(--color-secondary);">
      <span class="text-xl font-bold" style="color: var(--color-dark);">${produkt.ejer.teaternavn.charAt(0)}</span>
    </div>
    <div>
      <p class="font-semibold text-lg" style="color: var(--color-dark);">${produkt.ejer.teaternavn}</p>
      <p class="text-sm" style="color: var(--color-dark); opacity: 0.7;">📍 ${produkt.ejer.lokation}</p>
      ${produkt.ejer.email ? `<p class="text-sm" style="color: var(--color-primary);">✉️ ${produkt.ejer.email}</p>` : ''}
    </div>
  `;
}

function renderDetails() {
  const detailsGrid = document.getElementById('detailsGrid');
  
  let html = '';
  
  // Produkt ID
  html += `
    <div class="info-item">
      <div class="info-label">Produkt ID</div>
      <div class="info-value">#${produkt.id}</div>
    </div>
  `;
  
  // Lokation
  if (produkt.ejer?.lokation) {
    html += `
      <div class="info-item">
        <div class="info-label">Lokation</div>
        <div class="info-value">📍 ${produkt.ejer.lokation}</div>
      </div>
    `;
  }
  
  // Antal billeder
  html += `
    <div class="info-item">
      <div class="info-label">Antal billeder</div>
      <div class="info-value">📷 ${billeder.length}</div>
    </div>
  `;
  
  // Status
  html += `
    <div class="info-item">
      <div class="info-label">Status</div>
      <div class="info-value">${produkt.renoveres ? '🔧 Under renovering' : '✅ Tilgængelig'}</div>
    </div>
  `;
  
  detailsGrid.innerHTML = html;
}

function renderReservationer() {
  const reservationerListe = document.getElementById('reservationerListe');
  const reservationerSection = document.getElementById('reservationerSection');
  
  if (!produkt.reservationer || produkt.reservationer.length === 0) {
    reservationerListe.innerHTML = `
      <div class="text-center py-8" style="color: var(--color-dark); opacity: 0.7;">
        <span class="text-4xl mb-2 block">📅</span>
        <p>Ingen reservationer på dette produkt</p>
      </div>
    `;
    return;
  }
  
  const now = new Date();
  
  reservationerListe.innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr style="border-bottom: 2px solid var(--color-secondary);">
            <th class="text-left py-3 px-4" style="color: var(--color-dark);">Teater</th>
            <th class="text-left py-3 px-4" style="color: var(--color-dark);">Periode</th>
            <th class="text-left py-3 px-4" style="color: var(--color-dark);">Status</th>
          </tr>
        </thead>
        <tbody>
          ${produkt.reservationer.map(res => {
            const fraDato = new Date(res.fra_dato);
            const tilDato = new Date(res.til_dato);
            const isActive = now >= fraDato && now <= tilDato;
            const isPast = now > tilDato;
            
            return `
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td class="py-3 px-4">
                  <div class="font-semibold" style="color: var(--color-dark);">${res.teaternavn}</div>
                  <div class="text-sm" style="color: var(--color-dark); opacity: 0.7;">${res.bruger}</div>
                </td>
                <td class="py-3 px-4" style="color: var(--color-dark);">
                  ${formatDate(fraDato)} - ${formatDate(tilDato)}
                </td>
                <td class="py-3 px-4">
                  ${isActive 
                    ? '<span class="px-3 py-1 rounded-full text-sm font-semibold" style="background-color: #dcfce7; color: #16a34a;">Aktiv</span>'
                    : isPast
                      ? '<span class="px-3 py-1 rounded-full text-sm font-semibold" style="background-color: #f3f4f6; color: #6b7280;">Afsluttet</span>'
                      : '<span class="px-3 py-1 rounded-full text-sm font-semibold" style="background-color: #dbeafe; color: #2563eb;">Kommende</span>'
                  }
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function formatDate(date) {
  return date.toLocaleDateString('da-DK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

// ============= KURV FUNKTIONER =============

function getKurv() {
  const kurv = localStorage.getItem('sceneskift_kurv');
  return kurv ? JSON.parse(kurv) : [];
}

function saveKurv(kurv) {
  localStorage.setItem('sceneskift_kurv', JSON.stringify(kurv));
  updateKurvBadge();
  updateKurvButtons();
}

function tilfoejTilKurv() {
  if (!produkt) return;
  
  const kurv = getKurv();
  
  // Tjek om produktet allerede er i kurven
  if (kurv.some(item => item.id === produkt.id)) {
    showNotification('Produktet er allerede i din forespørgsel', 'info');
    return;
  }
  
  // Tilføj produkt med nødvendig info
  kurv.push({
    id: produkt.id,
    navn: produkt.navn,
    billede: billeder[0],
    ejer: produkt.ejer?.teaternavn || 'Ukendt',
    tilfojetDato: new Date().toISOString()
  });
  
  saveKurv(kurv);
  showNotification('Tilføjet til forespørgsel! 🛒', 'success');
}

function fjernFraKurv() {
  if (!produkt) return;
  
  let kurv = getKurv();
  kurv = kurv.filter(item => item.id !== produkt.id);
  saveKurv(kurv);
  showNotification('Fjernet fra forespørgsel', 'info');
}

function updateKurvButtons() {
  if (!produkt) return;
  
  const kurv = getKurv();
  const erIKurv = kurv.some(item => item.id === produkt.id);
  
  const tilfoejBtn = document.getElementById('tilfoejKurvBtn');
  const fjernBtn = document.getElementById('fjernKurvBtn');
  
  if (erIKurv) {
    tilfoejBtn.classList.add('hidden');
    fjernBtn.classList.remove('hidden');
  } else {
    tilfoejBtn.classList.remove('hidden');
    fjernBtn.classList.add('hidden');
  }
}

function updateKurvBadge() {
  const kurv = getKurv();
  const badge = document.getElementById('kurvBadge');
  const count = document.getElementById('kurvCount');
  
  if (kurv.length > 0) {
    badge.style.display = 'block';
    count.textContent = kurv.length;
  } else {
    badge.style.display = 'none';
  }
}

function showNotification(message, type = 'info') {
  // Fjern eksisterende notifikationer
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();
  
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    padding: 1rem 1.5rem;
    border-radius: 0.75rem;
    font-weight: 600;
    z-index: 1000;
    animation: slideIn 0.3s ease;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  `;
  
  if (type === 'success') {
    notification.style.backgroundColor = '#dcfce7';
    notification.style.color = '#16a34a';
  } else if (type === 'error') {
    notification.style.backgroundColor = '#fee2e2';
    notification.style.color = '#dc2626';
  } else {
    notification.style.backgroundColor = '#dbeafe';
    notification.style.color = '#2563eb';
  }
  
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // Tilføj animation styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
  
  // Fjern efter 3 sekunder
  setTimeout(() => {
    notification.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
