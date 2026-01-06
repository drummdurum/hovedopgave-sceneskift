// Admin panel functions

// Hent alle brugere
async function loadUsers() {
  try {
    const response = await fetch('/api/admin/users');
    const data = await response.json();
    
    if (response.ok) {
      const users = data.users;
      
      // Opdater stats
      document.getElementById('totalUsers').textContent = users.length;
      document.getElementById('pendingUsers').textContent = users.filter(u => !u.godkendt).length;
      document.getElementById('approvedUsers').textContent = users.filter(u => u.godkendt).length;
      
      // Afventende brugere
      renderPendingUsers(users.filter(u => !u.godkendt));
      
      // Alle brugere tabel
      renderUsersTable(users);
    }
  } catch (error) {
    console.error('Fejl ved indlæsning af brugere:', error);
  }
}

// Render afventende brugere
function renderPendingUsers(pendingUsers) {
  const pendingList = document.getElementById('pendingList');
  
  if (pendingUsers.length === 0) {
    pendingList.innerHTML = '<p class="p-4 rounded-xl text-center" style="background-color: #dcfce7; color: #16a34a;">🎉 Ingen afventende godkendelser!</p>';
  } else {
    pendingList.innerHTML = pendingUsers.map(user => `
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 md:p-6 rounded-xl" style="background-color: #fef3c7;">
        <div class="flex items-center gap-3 md:gap-4 w-full sm:w-auto">
          <div class="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center flex-shrink-0" style="background-color: var(--color-secondary);">
            <span class="text-lg md:text-xl font-bold" style="color: var(--color-dark);">${user.navn.charAt(0)}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-bold text-base md:text-lg truncate" style="color: var(--color-dark);">${user.navn}</p>
            <p class="text-sm md:text-base truncate" style="color: var(--color-dark); opacity: 0.7;">${user.teaternavn} · ${user.lokation}</p>
            <p class="text-xs md:text-sm truncate" style="color: var(--color-dark); opacity: 0.6;">${user.email}</p>
          </div>
        </div>
        <div class="flex gap-2 w-full sm:w-auto">
          <button onclick="approveUser(${user.id})" class="flex-1 sm:flex-none px-3 md:px-4 py-2 rounded-xl text-sm md:text-base font-bold transition" style="background-color: #16a34a; color: white;">
            ✓ Godkend
          </button>
          <button onclick="rejectUser(${user.id})" class="flex-1 sm:flex-none px-3 md:px-4 py-2 rounded-xl text-sm md:text-base font-bold transition" style="background-color: #dc2626; color: white;">
            ✗ Afvis
          </button>
        </div>
      </div>
    `).join('');
  }
}

// Render brugere tabel
function renderUsersTable(users) {
  const usersList = document.getElementById('usersList');
  usersList.innerHTML = users.map(user => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td class="p-2 md:p-4 font-semibold text-xs md:text-sm" style="color: var(--color-dark);">${user.navn}</td>
      <td class="p-2 md:p-4 text-xs md:text-sm" style="color: var(--color-dark);">${user.email}</td>
      <td class="p-2 md:p-4 text-xs md:text-sm" style="color: var(--color-dark);">${user.teaternavn}</td>
      <td class="p-2 md:p-4 text-xs md:text-sm" style="color: var(--color-dark);">${user.lokation}</td>
      <td class="p-2 md:p-4">
        ${user.godkendt 
          ? '<span class="px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-semibold" style="background-color: #dcfce7; color: #16a34a;">Godkendt</span>'
          : '<span class="px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-semibold" style="background-color: #fef3c7; color: #d97706;">Afventer</span>'
        }
      </td>
      <td class="p-2 md:p-4">
        <span class="px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-semibold" style="background-color: ${user.rolle === 'admin' ? 'var(--color-primary)' : '#f3f4f6'}; color: ${user.rolle === 'admin' ? 'white' : 'var(--color-dark)'};">
          ${user.rolle}
        </span>
      </td>
      <td class="p-2 md:p-4">
        <div class="flex flex-col md:flex-row gap-1 md:gap-2">
          ${!user.godkendt ? `
            <button onclick="approveUser(${user.id})" class="px-2 md:px-3 py-1 rounded-lg text-xs md:text-sm whitespace-nowrap" style="background-color: #16a34a; color: white;">Godkend</button>
          ` : ''}
          ${user.rolle !== 'admin' ? `
            <button onclick="makeAdmin(${user.id})" class="px-2 md:px-3 py-1 rounded-lg text-xs md:text-sm whitespace-nowrap" style="background-color: var(--color-primary); color: white;">Gør admin</button>
          ` : ''}
        </div>
      </td>
    </tr>
  `).join('');
}

// Godkend bruger
async function approveUser(userId) {
  try {
    const response = await fetch(`/api/admin/users/${userId}/approve`, { method: 'POST' });
    if (response.ok) {
      loadUsers();
    } else {
      alert('Fejl ved godkendelse af bruger');
    }
  } catch (error) {
    console.error('Fejl:', error);
  }
}

// Afvis/slet bruger
async function rejectUser(userId) {
  if (!confirm('Er du sikker på at du vil afvise denne bruger? Brugeren vil blive slettet.')) return;
  
  try {
    const response = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
    if (response.ok) {
      loadUsers();
    } else {
      alert('Fejl ved afvisning af bruger');
    }
  } catch (error) {
    console.error('Fejl:', error);
  }
}

// Gør bruger til admin
async function makeAdmin(userId) {
  if (!confirm('Er du sikker på at du vil gøre denne bruger til admin?')) return;
  
  try {
    const response = await fetch(`/api/admin/users/${userId}/make-admin`, { method: 'POST' });
    if (response.ok) {
      loadUsers();
    } else {
      alert('Fejl ved ændring af rolle');
    }
  } catch (error) {
    console.error('Fejl:', error);
  }
}

// Indlæs brugere ved page load
document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('pendingList')) {
    loadUsers();
  }
});
