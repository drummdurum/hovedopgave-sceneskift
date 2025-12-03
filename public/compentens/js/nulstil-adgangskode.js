// Nulstil adgangskode form handler
document.addEventListener('DOMContentLoaded', async function() {
  const loadingState = document.getElementById('loadingState');
  const errorState = document.getElementById('errorState');
  const resetForm = document.getElementById('resetForm');
  const successState = document.getElementById('successState');
  const errorMessage = document.getElementById('errorMessage');
  const token = document.getElementById('token')?.value;

  // Verificer token
  if (!token) {
    showError('Ugyldigt link. Prøv at anmode om et nyt.');
    return;
  }

  try {
    const response = await fetch(`/password/verificer-token/${token}`);
    const data = await response.json();

    if (response.ok && data.valid) {
      loadingState.classList.add('hidden');
      resetForm.classList.remove('hidden');
      setupForm();
    } else {
      showError(data.error || 'Ugyldigt eller udløbet link.');
    }
  } catch (error) {
    showError('Der opstod en fejl ved verificering af linket.');
  }

  function showError(message) {
    loadingState.classList.add('hidden');
    errorMessage.textContent = message;
    errorState.classList.remove('hidden');
  }

  function setupForm() {
    const form = document.getElementById('newPasswordForm');
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const errorDiv = document.getElementById('resetError');
      const submitBtn = document.getElementById('submitBtn');
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      
      errorDiv.classList.add('hidden');

      // Valider passwords matcher
      if (password !== confirmPassword) {
        errorDiv.textContent = 'Adgangskoderne matcher ikke.';
        errorDiv.classList.remove('hidden');
        return;
      }

      // Valider password længde
      if (password.length < 6) {
        errorDiv.textContent = 'Adgangskoden skal være mindst 6 tegn.';
        errorDiv.classList.remove('hidden');
        return;
      }

      // Disable button og vis loading
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="animate-pulse">Nulstiller...</span>';

      try {
        const response = await fetch('/password/nulstil-adgangskode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, password })
        });

        const data = await response.json();

        if (response.ok) {
          resetForm.classList.add('hidden');
          successState.classList.remove('hidden');
        } else {
          errorDiv.textContent = data.error || 'Der opstod en fejl. Prøv igen.';
          errorDiv.classList.remove('hidden');
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Nulstil adgangskode';
        }
      } catch (error) {
        errorDiv.textContent = 'Der opstod en netværksfejl. Prøv igen.';
        errorDiv.classList.remove('hidden');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Nulstil adgangskode';
      }
    });
  }
});
