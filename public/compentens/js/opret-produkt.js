// Opret produkt form handler
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('opretProduktForm');
  const billedeInput = document.getElementById('billede');
  const previewContainer = document.getElementById('billedePreview');
  const previewImg = document.getElementById('previewImg');
  const kategoriContainer = document.getElementById('kategoriContainer');
  
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
  
  loadKategorier();
  
  // Billede preview
  if (billedeInput) {
    billedeInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          previewImg.src = e.target.result;
          previewContainer.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
      } else {
        previewContainer.classList.add('hidden');
      }
    });
  }
  
  // Form submit
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const errorDiv = document.getElementById('opretError');
      const successDiv = document.getElementById('opretSuccess');
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
      
      const formData = new FormData();
      formData.append('navn', document.getElementById('navn').value);
      formData.append('beskrivelse', document.getElementById('beskrivelse').value);
      formData.append('kategorier', JSON.stringify(selectedKategorier));
      formData.append('skjult', document.getElementById('skjult').checked);
      formData.append('billede', document.getElementById('billede').files[0]);
      
      try {
        const response = await fetch('/produkter', {
          method: 'POST',
          body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
          successDiv.textContent = 'Produkt oprettet! Omdirigerer...';
          successDiv.classList.remove('hidden');
          form.reset();
          previewContainer.classList.add('hidden');
          // Reset checkboxes
          document.querySelectorAll('input[name="kategorier"]').forEach(cb => cb.checked = false);
          setTimeout(() => {
            window.location.href = '/profile';
          }, 2000);
        } else {
          errorDiv.textContent = data.error || 'Der opstod en fejl ved oprettelse';
          errorDiv.classList.remove('hidden');
        }
      } catch (error) {
        errorDiv.textContent = 'Der opstod en netværksfejl. Prøv igen.';
        errorDiv.classList.remove('hidden');
      }
    });
  }
});
