// Glemt adgangskode form handler
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('forgotPasswordForm');
  
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const errorDiv = document.getElementById('forgotError');
      const successDiv = document.getElementById('forgotSuccess');
      const submitBtn = document.getElementById('submitBtn');
      
      errorDiv.classList.add('hidden');
      successDiv.classList.add('hidden');
      
      const email = document.getElementById('email').value;
      
      // Disable button og vis loading
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="animate-pulse">Sender...</span>';
      
      try {
        const response = await fetch('/password/glemt-adgangskode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          successDiv.innerHTML = `
            <strong>Email sendt!</strong><br>
            ${data.message}
          `;
          successDiv.classList.remove('hidden');
          form.reset();
        } else {
          errorDiv.textContent = data.error || 'Der opstod en fejl. Prøv igen.';
          errorDiv.classList.remove('hidden');
        }
      } catch (error) {
        errorDiv.textContent = 'Der opstod en netværksfejl. Prøv igen.';
        errorDiv.classList.remove('hidden');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Send nulstillingslink';
      }
    });
  }
});
