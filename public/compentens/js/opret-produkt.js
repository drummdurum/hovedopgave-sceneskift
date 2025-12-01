// Opret produkt form handler
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('opretProduktForm');
  const billedeInput = document.getElementById('billede');
  const previewContainer = document.getElementById('billedePreview');
  const previewImg = document.getElementById('previewImg');
  
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
      
      const formData = new FormData();
      formData.append('navn', document.getElementById('navn').value);
      formData.append('beskrivelse', document.getElementById('beskrivelse').value);
      formData.append('kategori', document.getElementById('kategori').value);
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
