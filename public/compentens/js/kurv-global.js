// Global kurv funktionalitet
// Inkluder denne fil på alle sider hvor kurv-badge skal vises

// Bruger ID til bruger-specifik kurv
let currentUserId = null;

document.addEventListener('DOMContentLoaded', async function() {
  // Hent bruger ID først
  await fetchCurrentUserId();
  initKurvBadge();
  initKurvModal();
});

// Hent nuværende bruger ID fra session
async function fetchCurrentUserId() {
  try {
    const response = await fetch('/auth/me');
    if (response.ok) {
      const data = await response.json();
      currentUserId = data.user?.id || null;
    }
  } catch (error) {
    console.log('Bruger ikke logget ind');
    currentUserId = null;
  }
}

// Få kurv-nøgle for nuværende bruger
function getKurvKey() {
  if (currentUserId) {
    return `sceneskift_kurv_user_${currentUserId}`;
  }
  return 'sceneskift_kurv_guest';
}

function initKurvBadge() {
  // Opret kurv badge element hvis det ikke allerede findes
  if (!document.getElementById('floatingKurvBadge')) {
    const badge = document.createElement('div');
    badge.className = 'kurv-badge';
    badge.id = 'floatingKurvBadge';
    badge.style.display = 'none';
    badge.innerHTML = `
      <button onclick="openKurvModal()" class="kurv-btn" title="Se din forespørgselskurv">
        🛒
        <span class="kurv-count" id="kurvCount">0</span>
      </button>
    `;
    document.body.appendChild(badge);
  }
  
  updateGlobalKurvBadge();
}

function initKurvModal() {
  // Opret modal hvis den ikke allerede findes
  if (!document.getElementById('kurvModal')) {
    const modal = document.createElement('div');
    modal.id = 'kurvModal';
    modal.className = 'kurv-modal';
    modal.innerHTML = `
      <div class="kurv-modal-backdrop" onclick="closeKurvModal()"></div>
      <div class="kurv-modal-content">
        <div class="kurv-modal-header">
          <h2>🛒 Din forespørgselskurv</h2>
          <button class="kurv-modal-close" onclick="closeKurvModal()">×</button>
        </div>
        
        <div class="kurv-modal-body">
          <!-- Kurv produkter -->
          <div id="kurvProdukterListe" class="kurv-produkter-liste">
            <!-- Produkter genereres her -->
          </div>
          
          <!-- Tom kurv besked -->
          <div id="kurvTomBesked" class="kurv-tom-besked hidden">
            <span class="text-5xl mb-4 block">🛒</span>
            <p>Din kurv er tom</p>
            <a href="/rekvisitter" class="btn-secondary mt-4" style="border-radius: 100px;">Se rekvisitter</a>
          </div>
          
          <!-- Reservationsperiode valg -->
          <div id="reservationsPeriodeValg" class="reservations-periode-valg">
            <h3>📅 Vælg reservationsperiode</h3>
            
            <!-- Vælg metode -->
            <div class="periode-metode-valg">
              <label class="periode-radio">
                <input type="radio" name="periodeMetode" value="forestillingsperiode" checked onchange="togglePeriodeMetode()">
                <span>Vælg forestillingsperiode</span>
              </label>
              <label class="periode-radio">
                <input type="radio" name="periodeMetode" value="manuel" onchange="togglePeriodeMetode()">
                <span>Vælg datoer manuelt</span>
              </label>
            </div>
            
            <!-- Forestillingsperiode dropdown -->
            <div id="forestillingsperiodeValg" class="periode-input-group">
              <label for="kurvForestillingsperiode">Forestillingsperiode</label>
              <select id="kurvForestillingsperiode" onchange="opdaterValgtePeriodeDatoer()">
                <option value="">Vælg en forestillingsperiode...</option>
              </select>
            </div>
            
            <!-- Manuel dato-valg -->
            <div id="manuelDatoValg" class="periode-input-group hidden">
              <div class="dato-inputs">
                <div>
                  <label for="kurvFraDato">Fra dato</label>
                  <input type="date" id="kurvFraDato" onclick="this.showPicker()">
                </div>
                <div>
                  <label for="kurvTilDato">Til dato</label>
                  <input type="date" id="kurvTilDato" onclick="this.showPicker()">
                </div>
              </div>
            </div>
            
            <!-- Valgt periode visning -->
            <div id="valgtPeriodeInfo" class="valgt-periode-info hidden">
              <div class="periode-info-box">
                <span class="periode-label">Valgt periode:</span>
                <span id="valgtPeriodeTekst" class="periode-tekst"></span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="kurv-modal-footer">
          <button class="btn-secondary" onclick="closeKurvModal()" style="border-radius: 100px;">Annuller</button>
          <button id="bekraeftReservationBtn" class="btn-primary" onclick="bekraeftReservation()" style="border-radius: 100px;" disabled>
            ✉️ Send forespørgsel
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    // Indlæs forestillingsperioder
    loadForestillingsperioderTilKurv();
  }
}

// Åbn kurv modal
function openKurvModal() {
  const modal = document.getElementById('kurvModal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    renderKurvProdukter();
    loadForestillingsperioderTilKurv();
  }
}

// Luk kurv modal
function closeKurvModal() {
  const modal = document.getElementById('kurvModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Render kurv produkter i modal
function renderKurvProdukter() {
  const kurv = getKurv();
  const liste = document.getElementById('kurvProdukterListe');
  const tomBesked = document.getElementById('kurvTomBesked');
  const periodeValg = document.getElementById('reservationsPeriodeValg');
  const bekraeftBtn = document.getElementById('bekraeftReservationBtn');
  
  if (kurv.length === 0) {
    liste.classList.add('hidden');
    tomBesked.classList.remove('hidden');
    periodeValg.classList.add('hidden');
    bekraeftBtn.disabled = true;
    return;
  }
  
  liste.classList.remove('hidden');
  tomBesked.classList.add('hidden');
  periodeValg.classList.remove('hidden');
  
  liste.innerHTML = kurv.map(item => `
    <div class="kurv-produkt-item">
      <img src="${item.billede}" alt="${item.navn}" onerror="this.src='/compentens/image/placeholder.webp'">
      <div class="kurv-produkt-info">
        <h4>${item.navn}</h4>
        <p>Ejer: ${item.ejer}</p>
      </div>
      <button class="kurv-fjern-btn" onclick="fjernOgOpdaterModal(${item.id})" title="Fjern fra kurv">
        ×
      </button>
    </div>
  `).join('');
  
  validateReservationForm();
}

// Fjern produkt og opdater modal
function fjernOgOpdaterModal(produktId) {
  fjernProduktFraKurv(produktId);
  renderKurvProdukter();
}

// Indlæs forestillingsperioder til kurv dropdown
async function loadForestillingsperioderTilKurv() {
  const select = document.getElementById('kurvForestillingsperiode');
  if (!select) return;
  
  try {
    const response = await fetch('/api/forestillingsperioder/mine');
    if (!response.ok) {
      // Bruger ikke logget ind - skjul forestillingsperiode valg
      select.innerHTML = '<option value="">Log ind for at se dine forestillingsperioder</option>';
      return;
    }
    
    const data = await response.json();
    const perioder = data.forestillingsperioder || [];
    
    // Filtrer kun aktive/kommende perioder
    const now = new Date();
    const aktivePerioder = perioder.filter(p => new Date(p.slut_dato) >= now);
    
    if (aktivePerioder.length === 0) {
      select.innerHTML = '<option value="">Ingen aktive forestillingsperioder</option>';
      return;
    }
    
    select.innerHTML = '<option value="">Vælg en forestillingsperiode...</option>' + 
      aktivePerioder.map(p => {
        const start = new Date(p.start_dato).toLocaleDateString('da-DK');
        const slut = new Date(p.slut_dato).toLocaleDateString('da-DK');
        return `<option value="${p.id}" data-start="${p.start_dato}" data-slut="${p.slut_dato}">
          ${p.navn} (${start} - ${slut})
        </option>`;
      }).join('');
      
  } catch (error) {
    console.error('Fejl ved indlæsning af forestillingsperioder:', error);
    select.innerHTML = '<option value="">Kunne ikke indlæse perioder</option>';
  }
}

// Toggle mellem forestillingsperiode og manuel dato
function togglePeriodeMetode() {
  const metode = document.querySelector('input[name="periodeMetode"]:checked').value;
  const fpValg = document.getElementById('forestillingsperiodeValg');
  const manuelValg = document.getElementById('manuelDatoValg');
  const periodeInfo = document.getElementById('valgtPeriodeInfo');
  
  if (metode === 'forestillingsperiode') {
    fpValg.classList.remove('hidden');
    manuelValg.classList.add('hidden');
    opdaterValgtePeriodeDatoer();
  } else {
    fpValg.classList.add('hidden');
    manuelValg.classList.remove('hidden');
    periodeInfo.classList.add('hidden');
    validateReservationForm();
  }
}

// Opdater visning af valgt periode fra dropdown
function opdaterValgtePeriodeDatoer() {
  const select = document.getElementById('kurvForestillingsperiode');
  const periodeInfo = document.getElementById('valgtPeriodeInfo');
  const periodeTekst = document.getElementById('valgtPeriodeTekst');
  
  const selectedOption = select.options[select.selectedIndex];
  
  if (select.value && selectedOption.dataset.start && selectedOption.dataset.slut) {
    const start = new Date(selectedOption.dataset.start).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' });
    const slut = new Date(selectedOption.dataset.slut).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' });
    periodeTekst.textContent = `${start} til ${slut}`;
    periodeInfo.classList.remove('hidden');
  } else {
    periodeInfo.classList.add('hidden');
  }
  
  validateReservationForm();
}

// Valider reservation form
function validateReservationForm() {
  const kurv = getKurv();
  const bekraeftBtn = document.getElementById('bekraeftReservationBtn');
  const metode = document.querySelector('input[name="periodeMetode"]:checked')?.value;
  
  let isValid = kurv.length > 0;
  
  if (metode === 'forestillingsperiode') {
    const fpValg = document.getElementById('kurvForestillingsperiode');
    isValid = isValid && fpValg && fpValg.value;
  } else if (metode === 'manuel') {
    const fraDato = document.getElementById('kurvFraDato')?.value;
    const tilDato = document.getElementById('kurvTilDato')?.value;
    isValid = isValid && fraDato && tilDato && new Date(tilDato) >= new Date(fraDato);
  }
  
  if (bekraeftBtn) {
    bekraeftBtn.disabled = !isValid;
  }
}

// Lyt på dato-ændringer
document.addEventListener('change', function(e) {
  if (e.target.id === 'kurvFraDato' || e.target.id === 'kurvTilDato') {
    validateReservationForm();
    
    // Vis valgt periode for manuel valg
    const fraDato = document.getElementById('kurvFraDato')?.value;
    const tilDato = document.getElementById('kurvTilDato')?.value;
    const periodeInfo = document.getElementById('valgtPeriodeInfo');
    const periodeTekst = document.getElementById('valgtPeriodeTekst');
    
    if (fraDato && tilDato) {
      const start = new Date(fraDato).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' });
      const slut = new Date(tilDato).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' });
      periodeTekst.textContent = `${start} til ${slut}`;
      periodeInfo.classList.remove('hidden');
    } else {
      periodeInfo.classList.add('hidden');
    }
  }
});

// Bekræft reservation
async function bekraeftReservation() {
  const kurv = getKurv();
  if (kurv.length === 0) return;
  
  const metode = document.querySelector('input[name="periodeMetode"]:checked').value;
  let startDato, slutDato, forestillingsperiodeId;
  
  if (metode === 'forestillingsperiode') {
    const select = document.getElementById('kurvForestillingsperiode');
    const selectedOption = select.options[select.selectedIndex];
    forestillingsperiodeId = select.value;
    startDato = selectedOption.dataset.start;
    slutDato = selectedOption.dataset.slut;
  } else {
    startDato = document.getElementById('kurvFraDato').value;
    slutDato = document.getElementById('kurvTilDato').value;
  }
  
  const bekraeftBtn = document.getElementById('bekraeftReservationBtn');
  bekraeftBtn.disabled = true;
  bekraeftBtn.textContent = 'Sender...';
  
  try {
    // Send reservation for hvert produkt
    const produktIds = kurv.map(item => item.id);
    
    const response = await fetch('/api/reservationer/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        produkt_ids: produktIds,
        start_dato: startDato,
        slut_dato: slutDato,
        forestillingsperiode_id: forestillingsperiodeId || null
      })
    });
    
    if (response.ok) {
      // Tøm kurven
      saveKurv([]);
      closeKurvModal();
      showKurvNotification('✅ Forespørgsel sendt! Du vil modtage svar fra ejerne.', 'success');
      
      // Opdater siden hvis nødvendigt
      if (typeof updateKurvButtons === 'function') {
        updateKurvButtons();
      }
    } else {
      const errorData = await response.json();
      
      // Håndter overlap-fejl specifikt
      if (response.status === 409 && errorData.konflikter) {
        const konfliktNavne = errorData.konflikter.map(k => k.produktNavn).join(', ');
        showKurvNotification(`⚠️ Disse produkter er allerede reserveret i perioden: ${konfliktNavne}`, 'error');
        
        // Vis detaljer i konsollen
        console.warn('Reservation konflikter:', errorData.konflikter);
      } else {
        throw new Error(errorData.error || 'Kunne ikke sende forespørgsel');
      }
      
      bekraeftBtn.disabled = false;
      bekraeftBtn.textContent = '✉️ Send forespørgsel';
    }
  } catch (error) {
    console.error('Fejl ved reservation:', error);
    showKurvNotification('❌ ' + error.message, 'error');
    bekraeftBtn.disabled = false;
    bekraeftBtn.textContent = '✉️ Send forespørgsel';
  }
}

function getKurv() {
  const key = getKurvKey();
  const kurv = localStorage.getItem(key);
  return kurv ? JSON.parse(kurv) : [];
}

function saveKurv(kurv) {
  const key = getKurvKey();
  localStorage.setItem(key, JSON.stringify(kurv));
  updateGlobalKurvBadge();
}

function updateGlobalKurvBadge() {
  const kurv = getKurv();
  
  // Opdater header badge
  const headerBadge = document.getElementById('kurvBadge');
  if (headerBadge) {
    if (kurv.length > 0) {
      headerBadge.classList.remove('hidden');
      headerBadge.textContent = kurv.length;
    } else {
      headerBadge.classList.add('hidden');
    }
  }
  
  // Opdater floating badge (bund højre)
  const floatingBadge = document.getElementById('floatingKurvBadge');
  const count = document.getElementById('kurvCount');
  if (floatingBadge && count) {
    count.textContent = kurv.length;
    floatingBadge.style.display = kurv.length > 0 ? 'block' : 'none';
  }
}

// Tilføj produkt til kurv (kan kaldes fra andre sider)
function tilfoejProduktTilKurv(produkt) {
  const kurv = getKurv();
  
  // Tjek om produktet allerede er i kurven
  if (kurv.some(item => item.id === produkt.id)) {
    showKurvNotification('Produktet er allerede i din forespørgsel', 'info');
    return false;
  }
  
  // Tilføj produkt med nødvendig info
  kurv.push({
    id: produkt.id,
    navn: produkt.navn,
    billede: produkt.billede || produkt.billede_url || '/compentens/image/placeholder.webp',
    ejer: produkt.ejer?.teaternavn || produkt.ejer || 'Ukendt',
    tilfojetDato: new Date().toISOString()
  });
  
  saveKurv(kurv);
  showKurvNotification('Tilføjet til forespørgsel! 🛒', 'success');
  return true;
}

// Fjern produkt fra kurv
function fjernProduktFraKurv(produktId) {
  let kurv = getKurv();
  kurv = kurv.filter(item => item.id !== produktId);
  saveKurv(kurv);
  showKurvNotification('Fjernet fra forespørgsel', 'info');
}

// Tjek om produkt er i kurv
function erProduktIKurv(produktId) {
  const kurv = getKurv();
  return kurv.some(item => item.id === produktId);
}

// Notifikation
function showKurvNotification(message, type = 'info') {
  // Fjern eksisterende notifikationer
  const existing = document.querySelector('.kurv-notification');
  if (existing) existing.remove();
  
  const notification = document.createElement('div');
  notification.className = 'kurv-notification';
  
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
  
  // Fjern efter 3 sekunder
  setTimeout(() => {
    notification.style.animation = 'kurvSlideIn 0.3s ease reverse';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
