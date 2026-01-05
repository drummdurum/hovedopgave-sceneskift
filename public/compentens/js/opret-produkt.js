// Opret produkt form handler
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('opretProduktForm');
  const billederInput = document.getElementById('billeder');
  const previewContainer = document.getElementById('billedePreview');
  const previewImagesContainer = document.getElementById('previewContainer');
  const kategoriContainer = document.getElementById('kategoriContainer');
  const forestillingsperiodeContainer = document.getElementById('forestillingsperiodeContainer');
  const oprettedeProdukterSection = document.getElementById('oprettedeProdukter');
  const produkterListe = document.getElementById('produkterListe');
  
  // Liste over oprettede produkter i denne session
  let oprettedeProdukter = [];
  
  // Indlæs kategorier fra API
  async function loadKategorier() {
    try {
      const response = await fetch('/produkter/kategorier');
      const data = await response.json();
      
      if (data.kategorier && data.kategorier.length > 0) {
        kategoriContainer.innerHTML = data.kategorier.map(kat => `
          <label class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-gray-100 transition">
            <input type="checkbox" name="kategorier" value="${kat.navn}" 
              class="w-4 h-4 rounded" style="accent-color: var(--color-primary);">
            <span style="color: var(--color-dark);">${kat.navn}</span>
          </label>
        `).join('');
      } else {
        kategoriContainer.innerHTML = '<p class="text-sm col-span-2" style="color: #dc2626;">Ingen kategorier fundet</p>';
      }
    } catch (error) {
      console.error('Error loading kategorier:', error);
      kategoriContainer.innerHTML = '<p class="text-sm col-span-2" style="color: #dc2626;">Fejl ved indlæsning af kategorier</p>';
    }
  }
  
  // Indlæs forestillingsperioder fra API (kun brugerens egne)
  async function loadForestillingsperioder() {
    try {
      const response = await fetch('/api/forestillingsperioder/mine');
      const data = await response.json();
      
      if (data.forestillingsperioder && data.forestillingsperioder.length > 0) {
        const now = new Date();
        // Filtrer kun aktive og fremtidige perioder
        const aktivePerioder = data.forestillingsperioder.filter(fp => {
          const slutDato = new Date(fp.slut_dato);
          return slutDato >= now;
        });
        
        if (aktivePerioder.length > 0) {
          forestillingsperiodeContainer.innerHTML = `
            <select id="forestillingsperiode" name="forestillingsperiode" 
              class="w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition"
              style="border-color: var(--color-primary); font-size: 1rem;">
              <option value="">-- Ingen forestillingsperiode --</option>
              ${aktivePerioder.map(fp => {
                const startDato = new Date(fp.start_dato).toLocaleDateString('da-DK');
                const slutDato = new Date(fp.slut_dato).toLocaleDateString('da-DK');
                return `<option value="${fp.id}">${fp.navn} (${startDato} - ${slutDato})</option>`;
              }).join('')}
            </select>
          `;
        } else {
          forestillingsperiodeContainer.innerHTML = `
            <p class="text-sm" style="color: var(--color-dark); opacity: 0.7;">
              Ingen aktive forestillingsperioder. 
              <button type="button" id="opretPeriodeBtn" style="color: var(--color-secondary); text-decoration: underline; background: none; border: none; cursor: pointer;">Opret en ny</button>
            </p>
          `;
          document.getElementById('opretPeriodeBtn').addEventListener('click', showOpretPeriodePopup);
        }
      } else {
        forestillingsperiodeContainer.innerHTML = `
          <p class="text-sm" style="color: var(--color-dark); opacity: 0.7;">
            Ingen forestillingsperioder oprettet endnu. 
            <button type="button" id="opretPeriodeBtn" style="color: var(--color-secondary); text-decoration: underline; background: none; border: none; cursor: pointer;">Opret en ny</button>
          </p>
        `;
        document.getElementById('opretPeriodeBtn').addEventListener('click', showOpretPeriodePopup);
      }
    } catch (error) {
      console.error('Error loading forestillingsperioder:', error);
      forestillingsperiodeContainer.innerHTML = '<p class="text-sm" style="color: #dc2626;">Fejl ved indlæsning af forestillingsperioder</p>';
    }
  }
  
  loadKategorier();
  loadForestillingsperioder();
  
  // Popup til oprettelse af forestillingsperiode
  function showOpretPeriodePopup() {
    const popupHtml = `
      <div id="periodePopup" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style="backdrop-filter: blur(4px);">
        <div class="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl" style="max-height: 90vh; overflow-y: auto;">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-2xl font-bold" style="color: var(--color-dark);">Opret forestillingsperiode</h3>
            <button type="button" id="closePopupBtn" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
          </div>
          
          <form id="opretPeriodeForm" class="space-y-4">
            <div>
              <label class="block text-sm font-bold mb-2" style="color: var(--color-dark);">Navn på forestilling</label>
              <input type="text" id="periodeNavn" required
                class="w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition"
                style="border-color: var(--color-primary);"
                placeholder="F.eks. Hamlet">
            </div>
            
            <div>
              <label class="block text-sm font-bold mb-2" style="color: var(--color-dark);">Startdato</label>
              <input type="date" id="periodeStartDato" required
                class="w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition"
                style="border-color: var(--color-primary);">
            </div>
            
            <div>
              <label class="block text-sm font-bold mb-2" style="color: var(--color-dark);">Slutdato</label>
              <input type="date" id="periodeSlutDato" required
                class="w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition"
                style="border-color: var(--color-primary);">
            </div>
            
            <div id="periodeError" class="hidden p-4 rounded-xl" style="background-color: #fee2e2; color: #dc2626;"></div>
            
            <div class="flex gap-3 pt-4">
              <button type="button" id="cancelPeriodeBtn"
                class="flex-1 py-3 rounded-xl font-bold transition"
                style="background-color: #f8f9fa; color: var(--color-dark);">
                Annuller
              </button>
              <button type="submit" id="submitPeriodeBtn"
                class="flex-1 py-3 rounded-xl font-bold text-white transition"
                style="background-color: var(--color-primary);">
                Opret periode
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', popupHtml);
    
    const popup = document.getElementById('periodePopup');
    const closeBtn = document.getElementById('closePopupBtn');
    const cancelBtn = document.getElementById('cancelPeriodeBtn');
    const periodeForm = document.getElementById('opretPeriodeForm');
    
    function closePopup() {
      popup.remove();
    }
    
    closeBtn.addEventListener('click', closePopup);
    cancelBtn.addEventListener('click', closePopup);
    popup.addEventListener('click', (e) => {
      if (e.target === popup) closePopup();
    });
    
    periodeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const errorDiv = document.getElementById('periodeError');
      const submitBtn = document.getElementById('submitPeriodeBtn');
      
      errorDiv.classList.add('hidden');
      
      const navn = document.getElementById('periodeNavn').value;
      const startDato = document.getElementById('periodeStartDato').value;
      const slutDato = document.getElementById('periodeSlutDato').value;
      
      if (new Date(slutDato) < new Date(startDato)) {
        errorDiv.textContent = 'Slutdato skal være efter startdato';
        errorDiv.classList.remove('hidden');
        return;
      }
      
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="animate-pulse">Opretter...</span>';
      
      try {
        const response = await fetch('/api/forestillingsperioder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            navn,
            start_dato: startDato,
            slut_dato: slutDato
          })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          closePopup();
          await loadForestillingsperioder();
        } else {
          errorDiv.textContent = data.error || 'Der opstod en fejl';
          errorDiv.classList.remove('hidden');
        }
      } catch (error) {
        errorDiv.textContent = 'Der opstod en netværksfejl. Prøv igen.';
        errorDiv.classList.remove('hidden');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Opret periode';
      }
    });
  }
  
  // Placering radio button styling
  const lagerEget = document.getElementById('lagerEget');
  const lagerSceneskift = document.getElementById('lagerSceneskift');
  const lagerEgetLabel = document.getElementById('lagerEgetLabel');
  const lagerSceneskiftLabel = document.getElementById('lagerSceneskiftLabel');
  
  function updatePlaceringStyle() {
    if (lagerEget.checked) {
      lagerEgetLabel.style.borderColor = 'var(--color-primary)';
      lagerEgetLabel.style.backgroundColor = '#f0fdf4';
      lagerSceneskiftLabel.style.borderColor = '#e5e7eb';
      lagerSceneskiftLabel.style.backgroundColor = '#f8f9fa';
    } else {
      lagerSceneskiftLabel.style.borderColor = 'var(--color-primary)';
      lagerSceneskiftLabel.style.backgroundColor = '#eff6ff';
      lagerEgetLabel.style.borderColor = '#e5e7eb';
      lagerEgetLabel.style.backgroundColor = '#f8f9fa';
    }
  }
  
  if (lagerEget && lagerSceneskift) {
    lagerEget.addEventListener('change', updatePlaceringStyle);
    lagerSceneskift.addEventListener('change', updatePlaceringStyle);
  }
  
  // Billede preview for multiple files
  if (billederInput) {
    billederInput.addEventListener('change', function(e) {
      const files = e.target.files;
      
      if (files.length > 0) {
        previewImagesContainer.innerHTML = '';
        previewContainer.classList.remove('hidden');
        
        if (files.length > 10) {
          previewImagesContainer.innerHTML = '<p class="text-sm" style="color: #dc2626;">Du kan maks vælge 10 billeder</p>';
          return;
        }
        
        Array.from(files).forEach((file, index) => {
          const reader = new FileReader();
          reader.onload = function(e) {
            const imgContainer = document.createElement('div');
            imgContainer.className = 'relative';
            imgContainer.innerHTML = `
              <img src="${e.target.result}" alt="Preview ${index + 1}" 
                class="h-32 w-32 object-cover rounded-xl shadow-lg">
              <span class="absolute top-1 left-1 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                ${index === 0 ? 'Primært' : index + 1}
              </span>
            `;
            previewImagesContainer.appendChild(imgContainer);
          };
          reader.readAsDataURL(file);
        });
      } else {
        previewContainer.classList.add('hidden');
      }
    });
  }
  
  // Vis oprettede produkter
  function updateOprettedeProdukter() {
    if (oprettedeProdukter.length > 0) {
      oprettedeProdukterSection.classList.remove('hidden');
      produkterListe.innerHTML = oprettedeProdukter.map(p => `
        <div class="flex items-center gap-4 p-4 rounded-xl" style="background-color: #f8f9fa;">
          <img src="${p.billeder && p.billeder.length > 0 ? p.billeder[0].url : p.billede_url}" 
            alt="${p.navn}" class="w-16 h-16 object-cover rounded-lg">
          <div class="flex-grow">
            <h4 class="font-bold" style="color: var(--color-dark);">${p.navn}</h4>
            <p class="text-sm" style="color: var(--color-dark); opacity: 0.7;">
              ${p.kategorier.join(', ')} • ${p.billeder ? p.billeder.length : 1} billede(r)
            </p>
          </div>
          <span class="px-3 py-1 rounded-full text-sm" style="background-color: #dcfce7; color: #16a34a;">
            ✓ Oprettet
          </span>
        </div>
      `).join('');
    }
  }
  
  // Form submit
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const errorDiv = document.getElementById('opretError');
      const successDiv = document.getElementById('opretSuccess');
      const submitBtn = document.getElementById('submitBtn');
      
      errorDiv.classList.add('hidden');
      successDiv.classList.add('hidden');
      
      // Hent valgte kategorier
      const selectedKategorier = Array.from(document.querySelectorAll('input[name="kategorier"]:checked'))
        .map(cb => cb.value);
      
      if (selectedKategorier.length === 0) {
        errorDiv.textContent = 'Vælg mindst én kategori';
        errorDiv.classList.remove('hidden');
        return;
      }
      
      // Tjek billeder
      const files = billederInput.files;
      if (files.length === 0) {
        errorDiv.textContent = 'Vælg mindst ét billede';
        errorDiv.classList.remove('hidden');
        return;
      }
      
      if (files.length > 10) {
        errorDiv.textContent = 'Du kan maks uploade 10 billeder';
        errorDiv.classList.remove('hidden');
        return;
      }
      
      // Disable submit og vis loading
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="animate-pulse">Opretter produkt...</span>';
      
      const formData = new FormData();
      formData.append('navn', document.getElementById('navn').value);
      formData.append('beskrivelse', document.getElementById('beskrivelse').value);
      formData.append('kategorier', JSON.stringify(selectedKategorier));
      formData.append('skjult', document.getElementById('skjult').checked);
      formData.append('renoveres', document.getElementById('renoveres').checked);
      formData.append('paa_sceneskift', document.getElementById('lagerSceneskift').checked);
      
      // Tilføj alle billeder
      Array.from(files).forEach(file => {
        formData.append('billeder', file);
      });
      
      // Tilføj forestillingsperiode hvis valgt
      const forestillingsperiodeSelect = document.getElementById('forestillingsperiode');
      const forestillingsperiodeId = forestillingsperiodeSelect?.value;
      
      try {
        const response = await fetch('/produkter', {
          method: 'POST',
          body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
          // Tilføj til forestillingsperiode hvis valgt
          if (forestillingsperiodeId && data.produkt) {
            try {
              await fetch(`/api/forestillingsperioder/${forestillingsperiodeId}/produkter`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ produkt_id: data.produkt.id })
              });
            } catch (fpError) {
              console.error('Fejl ved tilknytning til forestillingsperiode:', fpError);
            }
          }
          
          // Tilføj til oprettede produkter
          oprettedeProdukter.unshift(data.produkt);
          updateOprettedeProdukter();
          
          successDiv.innerHTML = `
            <strong>✓ Produkt "${data.produkt.navn}" oprettet!</strong><br>
            <span class="text-sm">Du kan oprette flere produkter eller gå tilbage til din profil.</span>
          `;
          successDiv.classList.remove('hidden');
          
          // Reset form men bliv på siden
          form.reset();
          previewContainer.classList.add('hidden');
          previewImagesContainer.innerHTML = '';
          document.querySelectorAll('input[name="kategorier"]').forEach(cb => cb.checked = false);
          if (forestillingsperiodeSelect) forestillingsperiodeSelect.value = '';
          
          // Scroll til success besked
          successDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Skjul success efter 5 sekunder
          setTimeout(() => {
            successDiv.classList.add('hidden');
          }, 5000);
          
        } else {
          errorDiv.textContent = data.error || 'Der opstod en fejl ved oprettelse';
          errorDiv.classList.remove('hidden');
        }
      } catch (error) {
        errorDiv.textContent = 'Der opstod en netværksfejl. Prøv igen.';
        errorDiv.classList.remove('hidden');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Opret produkt';
      }
    });
  }
});
