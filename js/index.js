document.addEventListener('DOMContentLoaded', function() {
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('navMenu');

  if(hamburger && navMenu){
    hamburger.addEventListener('click', () => {
      navMenu.classList.toggle('show');
    });

    // Opțional: închide meniul când dai click pe un link
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => navMenu.classList.remove('show'));
    });
  }
});
