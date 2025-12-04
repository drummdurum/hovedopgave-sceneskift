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
              <a href="/forestillingsperioder" style="color: var(--color-secondary); text-decoration: underline;">Opret en ny</a>
            </p>
          `;
        }
      } else {
        forestillingsperiodeContainer.innerHTML = `
          <p class="text-sm" style="color: var(--color-dark); opacity: 0.7;">
            Ingen forestillingsperioder oprettet endnu. 
            <a href="/forestillingsperioder" style="color: var(--color-secondary); text-decoration: underline;">Opret en ny</a>
          </p>
        `;
      }
    } catch (error) {
      console.error('Error loading forestillingsperioder:', error);
      forestillingsperiodeContainer.innerHTML = '<p class="text-sm" style="color: #dc2626;">Fejl ved indlæsning af forestillingsperioder</p>';
    }
  }
  
  loadKategorier();
  loadForestillingsperioder();
  
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
