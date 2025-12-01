// Rekvisitter side
let alleProdukter = [];

document.addEventListener('DOMContentLoaded', function() {
  loadAlleProdukter();
  
  // Enter-tast i søgefelt
  document.getElementById('soegning').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      filtrerProdukter();
    }
  });
});

async function loadAlleProdukter() {
  const grid = document.getElementById('produkterGrid');
  const ingenProdukter = document.getElementById('ingenProdukter');
  
  try {
    const response = await fetch('/produkter?skjult=false');
    const data = await response.json();
    
    if (response.ok) {
      alleProdukter = data.produkter;
      renderProdukter(alleProdukter);
    } else {
      grid.innerHTML = '<p style="color: #dc2626;">Fejl ved indlæsning af rekvisitter</p>';
    }
  } catch (error) {
    console.error('Fejl:', error);
    grid.innerHTML = '<p style="color: #dc2626;">Fejl ved indlæsning af rekvisitter</p>';
  }
}

function filtrerProdukter() {
  const kategori = document.getElementById('kategoriFilter').value;
  const soegning = document.getElementById('soegning').value.toLowerCase();
  
  let filtrerede = alleProdukter;
  
  if (kategori) {
    filtrerede = filtrerede.filter(p => p.kategori === kategori);
  }
  
  if (soegning) {
    filtrerede = filtrerede.filter(p => 
      p.navn.toLowerCase().includes(soegning) || 
      p.beskrivelse.toLowerCase().includes(soegning) ||
      p.ejer?.teaternavn?.toLowerCase().includes(soegning)
    );
  }
  
  renderProdukter(filtrerede);
}

function renderProdukter(produkter) {
  const grid = document.getElementById('produkterGrid');
  const ingenProdukter = document.getElementById('ingenProdukter');
  
  if (produkter.length === 0) {
    grid.innerHTML = '';
    ingenProdukter.classList.remove('hidden');
  } else {
    ingenProdukter.classList.add('hidden');
    grid.innerHTML = produkter.map(produkt => renderProduktKort(produkt)).join('');
  }
}

function renderProduktKort(produkt) {
  return `
    <div class="bg-white rounded-2xl shadow-xl overflow-hidden cursor-pointer transition transform hover:scale-105" onclick="visProdukt(${produkt.id})">
      <div class="h-48 overflow-hidden">
        <img src="${produkt.billede_url}" alt="${produkt.navn}" class="w-full h-full object-cover">
      </div>
      <div class="p-6">
        <div class="flex items-center justify-between mb-2">
          <span class="px-3 py-1 rounded-full text-sm font-semibold" style="background-color: var(--color-secondary); color: var(--color-dark);">
            ${produkt.kategori}
          </span>
        </div>
        <h3 class="text-xl font-bold mb-2" style="color: var(--color-dark);">${produkt.navn}</h3>
        <p class="mb-4 line-clamp-2" style="color: var(--color-dark); opacity: 0.8;">${produkt.beskrivelse}</p>
        ${produkt.ejer ? `
          <div class="flex items-center gap-2 pt-4" style="border-top: 1px solid #e5e7eb;">
            <div class="w-8 h-8 rounded-full flex items-center justify-center" style="background-color: var(--color-secondary);">
              <span class="text-sm font-bold" style="color: var(--color-dark);">${produkt.ejer.teaternavn.charAt(0)}</span>
            </div>
            <div>
              <p class="text-sm font-semibold" style="color: var(--color-dark);">${produkt.ejer.teaternavn}</p>
              <p class="text-xs" style="color: var(--color-dark); opacity: 0.7;">${produkt.ejer.lokation}</p>
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function visProdukt(id) {
  window.location.href = `/rekvisitter/${id}`;
}
