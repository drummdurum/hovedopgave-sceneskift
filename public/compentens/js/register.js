// Register form handler
document.addEventListener('DOMContentLoaded', function() {
  const registerForm = document.getElementById('registerForm');
  
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const errorDiv = document.getElementById('registerError');
      const successDiv = document.getElementById('registerSuccess');
      errorDiv.classList.add('hidden');
      successDiv.classList.add('hidden');
      
      const formData = {
        brugernavn: document.getElementById('brugernavn').value,
        password: document.getElementById('password').value,
        navn: document.getElementById('navn').value,
        email: document.getElementById('email').value,
        teaternavn: document.getElementById('teaternavn').value,
        lokation: document.getElementById('lokation').value,
        features: false
      };
      
      try {
        const response = await fetch('/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
          successDiv.innerHTML = '<strong>Konto oprettet!</strong> Din konto afventer nu godkendelse fra en administrator. Du vil modtage en e-mail, når kontoen er godkendt.';
          successDiv.classList.remove('hidden');
          registerForm.reset();
          setTimeout(() => {
            window.location.href = '/profile';
          }, 3000);
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
