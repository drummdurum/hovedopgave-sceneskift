// Profile page functions
async function logout() {
  try {
    const response = await fetch('/auth/logout', { method: 'POST' });
    if (response.ok) {
      window.location.href = '/';
    }
  } catch (error) {
    console.error('Logout fejl:', error);
  }
}

function editProfile() {
  // TODO: Implementer profil redigering
  alert('Profil redigering kommer snart!');
}
