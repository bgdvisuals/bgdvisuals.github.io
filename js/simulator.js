// Așteptăm ca tot conținutul paginii să fie încărcat înainte de a rula scriptul
document.addEventListener('DOMContentLoaded', () => {

  document.querySelectorAll('.slider').forEach(slider => {
    const wrapper = document.createElement('div');
    wrapper.className = 'slider-wrapper';
    slider.parentNode.insertBefore(wrapper, slider);
    wrapper.appendChild(slider);
    
    const fakeThumb = document.createElement('div');
    fakeThumb.className = 'fake-thumb';
    wrapper.appendChild(fakeThumb);
    
    function updateFakeThumb() {
      const min = parseFloat(slider.min) || 0;
      const max = parseFloat(slider.max) || 100;
      const val = parseFloat(slider.value);
      const percent = max > min ? ((val - min) / (max - min)) * 100 : 0;
      fakeThumb.style.left = `calc(${percent}% - ${percent * 0.2}px)`;
    }
    
    slider.addEventListener('input', updateFakeThumb);
    setTimeout(updateFakeThumb, 10);
  });

  
  /* -------------------- 1. SHUTTER SPEED (LOGICĂ GRADUALĂ LARGĂ) -------------------- */
  const shutterSlider = document.getElementById('shutter1');
  const shutterValueText = document.getElementById('shutterValue1');
  const ndFilter = document.getElementById('ndFilter1');
  const overexposedOverlay = document.getElementById('shutterOverlay1');
  const ndOverlay = document.getElementById('shutterNDOverlay1');
  const shutterValues = ['1s', '1/2', '1/4', '1/8', '1/15', '1/30', '1/60', '1/125', '1/250', '1/500', '1/1000'];

  function updateShutter() {
    const idx = parseInt(shutterSlider.value);
    shutterValueText.textContent = shutterValues[idx];

    // DEFINIM NOILE PUNCTE CHEIE PENTRU TRANZIȚIE
    // Punctul unde imaginea devine 100% afectată (la '1/4s').
    const fullEffectIndex = 2; 
    // Punctul de la care imaginea este considerată complet sigură (acum la '1/250s').
    const noEffectIndex = 8;
    
    let opacityValue = 0;

    // Calculăm opacitatea doar dacă suntem în zona de risc (sub 1/250s).
    if (idx < noEffectIndex) {
      if (idx <= fullEffectIndex) {
        // Dacă am atins sau depășit punctul de efect maxim, opacitatea este 1.
        opacityValue = 1;
      } else {
        // Altfel, calculăm opacitatea gradual în intervalul larg dintre '1/125s' și '1/4s'.
        const startGradient = noEffectIndex - 1; // Începe de la indexul 7 (1/125s)
        const gradientRange = startGradient - fullEffectIndex; // Intervalul de tranziție (7 - 2 = 5 pași)
        opacityValue = (startGradient - idx) / gradientRange;
      }
    }
    
    // Aplicăm opacitatea calculată la overlay-ul corect.
    if (ndFilter.checked) {
      // Dacă filtrul ND este activ, el primește efectul gradual.
      ndOverlay.style.opacity = opacityValue;
      overexposedOverlay.style.opacity = '0';
    } else {
      // Altfel, overlay-ul de supraexpunere primește efectul.
      overexposedOverlay.style.opacity = opacityValue;
      ndOverlay.style.opacity = '0';
    }
  }

  shutterSlider.addEventListener('input', updateShutter);
  ndFilter.addEventListener('change', updateShutter);
  updateShutter();


  /* -------------------- 2. ISO (LOGICĂ GRADUALĂ) -------------------- */
  const isoSlider = document.getElementById('iso2');
  const isoValueText = document.getElementById('isoValue2');
  const isoOverlay = document.getElementById('isoOverlay2');
  const isoValues = [100, 200, 400, 800, 1600, 3200];

  function updateISO() {
    const idx = parseInt(isoSlider.value);
    isoValueText.textContent = isoValues[idx];
    const maxIndex = parseInt(isoSlider.max);
    const opacityValue = idx / maxIndex;
    isoOverlay.style.opacity = opacityValue;
  }

  isoSlider.addEventListener('input', updateISO);
  updateISO();


  /* -------------------- 3. F-STOP (LOGICĂ GRADUALĂ INVERSATĂ) -------------------- */
  const fstopSlider = document.getElementById('fstop3');
  const fstopValueText = document.getElementById('fstopValue3');
  const fstopOverlay = document.getElementById('fstopOverlay3');
  const fstopValues = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16, 22];

  function updateFstop() {
    const idx = parseInt(fstopSlider.value);
    fstopValueText.textContent = 'f/' + fstopValues[idx];
    const maxIndex = parseInt(fstopSlider.max);
    const opacityValue = 1 - (idx / maxIndex);
    fstopOverlay.style.opacity = opacityValue;
  }

  fstopSlider.addEventListener('input', updateFstop);
  updateFstop();

});