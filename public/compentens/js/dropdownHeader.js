(function(){
  var userMenu = document.querySelector('.user-menu');
  if(!userMenu) return;
  var btn = userMenu.querySelector('.user-btn');
  var dd = userMenu.querySelector('.user-dropdown');
  
  function openMenu() {
    userMenu.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    dd.setAttribute('aria-hidden', 'false');
    dd.style.display = 'block';
  }
  
  function closeMenu() {
    userMenu.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    dd.setAttribute('aria-hidden', 'true');
    dd.style.display = 'none';
  }
  
  btn.addEventListener('click', function(e){
    e.stopPropagation();
    if(userMenu.classList.contains('open')) closeMenu(); 
    else openMenu();
  });
  
  document.addEventListener('click', function(e){
    if(!userMenu.contains(e.target)) closeMenu();
  });
  
  document.addEventListener('keydown', function(e){ 
    if(e.key === 'Escape') closeMenu(); 
  });
})();