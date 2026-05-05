// Funcții ajutătoare pentru citirea și scrierea de Cookie-uri
function setCookie(name, value, days) {
  let expires = "";
  if (days) {
    let date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

function getCookie(name) {
  let nameEQ = name + "=";
  let ca = document.cookie.split(';');
  for(let i=0;i < ca.length;i++) {
    let c = ca[i];
    while (c.charAt(0)==' ') c = c.substring(1,c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
  }
  return null;
}

document.addEventListener('DOMContentLoaded', function() {
  // Aplică fundalul animat dacă cookie-ul există și e true
  if (getCookie('bgAnimated') === 'true') {
    document.body.classList.add('animated-bg');
  }

  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('navMenu');

  if (!hamburger) console.error("EROARE: Butonul #hamburger nu a fost găsit!");
  if (!navMenu) console.error("EROARE: Meniul #navMenu nu a fost găsit!");

  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      console.log("CLICK!"); 
      navMenu.classList.toggle('show');
    });

    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => navMenu.classList.remove('show'));
    });
  }
});