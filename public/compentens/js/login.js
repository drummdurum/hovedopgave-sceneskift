// Login form handler
document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const errorDiv = document.getElementById('loginError');
      const successDiv = document.getElementById('loginSuccess');
      errorDiv.classList.add('hidden');
      successDiv.classList.add('hidden');
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      try {
        const response = await fetch('/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          successDiv.textContent = 'Login succesfuldt! Omdirigerer...';
          successDiv.classList.remove('hidden');
          setTimeout(() => {
            window.location.href = '/profile';
          }, 1000);
        } else {
          errorDiv.textContent = data.error || 'Der opstod en fejl ved login';
          errorDiv.classList.remove('hidden');
        }
      } catch (error) {
        errorDiv.textContent = 'Der opstod en netværksfejl. Prøv igen.';
        errorDiv.classList.remove('hidden');
      }
    });
  }
});
