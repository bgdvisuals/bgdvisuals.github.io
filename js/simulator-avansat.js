// js/simulator-avansat.js
document.addEventListener('DOMContentLoaded', () => {
    const apertureSlider = document.getElementById('aperture');
    const shutterSlider = document.getElementById('shutter');
    const isoSlider = document.getElementById('iso');
    const ndFilterToggle = document.getElementById('nd-filter');
    const apertureValueDisplay = document.getElementById('aperture-value');
    const shutterValueDisplay = document.getElementById('shutter-value');
    const isoValueDisplay = document.getElementById('iso-value');
    const modeSelector = document.getElementById('mode-selector');
    const viewfinder = document.getElementById('viewfinder');
    const sceneBackground = document.getElementById('scene-background');
    const pinwheel = document.getElementById('pinwheel');
    const pinwheelMain = document.getElementById('pinwheel-main');
    const pinwheelTrailContainer = document.getElementById('pinwheel-trail-container');
    const noiseOverlay = document.getElementById('noise-overlay');
    const brightnessOverlay = document.getElementById('brightness-overlay');
    const exposureIndicator = document.getElementById('exposure-indicator');
    const snapPhotoButton = document.getElementById('snap-photo');

    const APERTURE_STOPS = [1.8, 2.8, 4, 5.6, 8, 11, 16, 22, 32];
    const SHUTTER_STOPS = [1, 2, 4, 8, 15, 30, 60, 125, 250, 500, 1000, 2000, 4000];
    const ISO_STOPS = [100, 200, 400, 800, 1600, 3200, 6400];
    const APERTURE_EV = [2.3, 1.8, 1, 0.5, 0, -1, -2, -3, -4];
    const SHUTTER_EV = [6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6];
    const ISO_EV = [-2, -1, 0, 1, 2, 3, 4];
    const TARGET_EV = 0;
    const NUM_GHOSTS = 15;
    const PINWHEEL_ROTATION_SPEED = 0.2;
    const ND_FILTER_STOPS = 10;
    let currentMode = 'M';
    let isNdFilterActive = false;

    function updateSimulator() {
        if (currentMode === 'Av') autoAdjust('shutter');
        else if (currentMode === 'Tv') autoAdjust('aperture');
        const apertureIndex = parseInt(apertureSlider.value);
        const shutterIndex = parseInt(shutterSlider.value);
        const isoIndex = parseInt(isoSlider.value);
        const shutterSpeed = SHUTTER_STOPS[shutterIndex];
        let totalEV = APERTURE_EV[apertureIndex] + SHUTTER_EV[shutterIndex] + ISO_EV[isoIndex];
        if (isNdFilterActive) { totalEV -= ND_FILTER_STOPS; }
        const bgBlurAmount = (APERTURE_STOPS.length - 1 - apertureIndex) * 1.5;
        sceneBackground.style.filter = `blur(${bgBlurAmount}px)`;
        updateMotionBlur(shutterIndex);
        // Array ISO: 100, 200, 400, 800, 1600, 3200, 6400 (indecșii 0-6)
        let noiseOpacity = 0;
        if (isoIndex >= 3) { // De la ISO 800 în sus
            noiseOpacity = (isoIndex - 2) * 0.25; // Crește progresiv: 0.25, 0.5, 0.75, 1.0
        }
        noiseOverlay.style.opacity = noiseOpacity;
        const evDifference = totalEV - TARGET_EV;
        let brightnessOpacity = 0;
        if(evDifference < 0) {
            brightnessOverlay.style.backgroundColor = 'black';
            brightnessOpacity = Math.abs(evDifference) / 5;
        } else if (evDifference > 0) {
            brightnessOverlay.style.backgroundColor = 'white';
            brightnessOpacity = evDifference / 5;
        }
        brightnessOverlay.style.opacity = Math.min(brightnessOpacity, 0.95);
        apertureValueDisplay.textContent = `f/${APERTURE_STOPS[apertureIndex]}`;
        shutterValueDisplay.textContent = shutterSpeed >= 1 ? `1/${shutterSpeed}s` : `${shutterSpeed}"`;
        isoValueDisplay.textContent = `ISO ${ISO_STOPS[isoIndex]}`;
        const meterPercentage = 50 + (evDifference * (100 / 6));
        exposureIndicator.style.left = `${Math.max(0, Math.min(100, meterPercentage))}%`;
    }
    function updateMotionBlur(shutterIndex) {
        const ghosts = pinwheelTrailContainer.children;
        const maxBlurEffectAtShutterIndex = 6;
        const blurIntensity = Math.max(0, (maxBlurEffectAtShutterIndex - shutterIndex)) / maxBlurEffectAtShutterIndex;
        if (blurIntensity <= 0.05) {
            pinwheelMain.style.filter = 'blur(0px)';
            pinwheelMain.style.opacity = 1;
            for(let ghost of ghosts) { ghost.style.opacity = 0; }
            return;
        }
        pinwheelMain.style.filter = `blur(${blurIntensity * 1.5}px)`;
        pinwheelMain.style.opacity = 1 - (blurIntensity * 0.2);
        const numActiveGhosts = Math.ceil(blurIntensity * NUM_GHOSTS);
        for (let i = 0; i < NUM_GHOSTS; i++) {
            const ghost = ghosts[i];
            if (i < numActiveGhosts) {
                const trailProgress = i / (NUM_GHOSTS - 1);
                ghost.style.opacity = (1 - trailProgress) * 0.4 * blurIntensity;
                const maxRotationOffset = 70;
                const rotationOffset = (trailProgress) * maxRotationOffset * blurIntensity;
                ghost.style.transform = `rotate(-${rotationOffset}deg)`;
                ghost.style.filter = `blur(${trailProgress * 4 * blurIntensity + 1}px)`;
            } else { ghost.style.opacity = 0; }
        }
    }
    function handleModeChange(event) {
        currentMode = event.target.value;
        apertureSlider.disabled = false;
        shutterSlider.disabled = false;
        isoSlider.disabled = false;
        
        if (currentMode === 'Av') {
            shutterSlider.disabled = true;
            isoSlider.disabled = true;
        } else if (currentMode === 'Tv') {
            apertureSlider.disabled = true;
            isoSlider.disabled = true;
        }
        updateSimulator();
    }
    function autoAdjust(paramToAdjust) {
        const apertureIndex = parseInt(apertureSlider.value);
        const shutterIndex = parseInt(shutterSlider.value);
        let bestIsoIndex = 0; // Încercăm mereu să păstrăm ISO-ul la minim (100) pentru calitate maximă

        if (paramToAdjust === 'shutter') {
            let bestShutterIndex = 0;
            let minDiff = Infinity;
            
            // Căutăm prin toate valorile ISO până găsim expunerea perfectă
            for (let i = 0; i < ISO_EV.length; i++) {
                let currentEV = APERTURE_EV[apertureIndex] + ISO_EV[i];
                if (isNdFilterActive) currentEV -= ND_FILTER_STOPS;
                const targetShutterEV = TARGET_EV - currentEV;
                
                const closestSIndex = SHUTTER_EV.reduce((prev, curr, index) => (Math.abs(curr - targetShutterEV) < Math.abs(SHUTTER_EV[prev] - targetShutterEV) ? index : prev), 0);
                const diff = Math.abs(SHUTTER_EV[closestSIndex] - targetShutterEV);
                
                if (diff < minDiff) {
                    minDiff = diff;
                    bestShutterIndex = closestSIndex;
                    bestIsoIndex = i;
                }
                // Dacă am găsit expunerea 0 EV la o viteză sigură de mână (>= 1/60s), ne oprim
                if (diff === 0 && closestSIndex >= 6) break; 
            }
            shutterSlider.value = bestShutterIndex;
            isoSlider.value = bestIsoIndex;
            
        } else if (paramToAdjust === 'aperture') {
            let bestApertureIndex = 0;
            let minDiff = Infinity;
            
            for (let i = 0; i < ISO_EV.length; i++) {
                let currentEV = SHUTTER_EV[shutterIndex] + ISO_EV[i];
                if (isNdFilterActive) currentEV -= ND_FILTER_STOPS;
                const targetApertureEV = TARGET_EV - currentEV;
                
                const closestAIndex = APERTURE_EV.reduce((prev, curr, index) => (Math.abs(curr - targetApertureEV) < Math.abs(APERTURE_EV[prev] - targetApertureEV) ? index : prev), 0);
                const diff = Math.abs(APERTURE_EV[closestAIndex] - targetApertureEV);
                
                if (diff < minDiff) {
                    minDiff = diff;
                    bestApertureIndex = closestAIndex;
                    bestIsoIndex = i;
                }
                if (diff === 0) break; // Ne oprim la cel mai mic ISO care ne oferă expunere perfectă
            }
            apertureSlider.value = bestApertureIndex;
            isoSlider.value = bestIsoIndex;
        }
    }
    function createTrailGhosts() {
        const imageSrc = pinwheelMain.src;
        const createImage = () => {
            for (let i = 0; i < NUM_GHOSTS; i++) {
                const ghost = document.createElement('img');
                ghost.src = imageSrc;
                ghost.className = 'pinwheel-trail-ghost';
                pinwheelTrailContainer.appendChild(ghost);
            }
        };
        if (pinwheelMain.complete) { createImage(); } 
        else { pinwheelMain.onload = createImage; }
    }
    ['input', 'change'].forEach(evt => {
         apertureSlider.addEventListener(evt, updateSimulator);
         shutterSlider.addEventListener(evt, updateSimulator);
         isoSlider.addEventListener(evt, updateSimulator);
    });
    modeSelector.addEventListener('change', handleModeChange);
    ndFilterToggle.addEventListener('change', (e) => {
        isNdFilterActive = e.target.checked;
        updateSimulator();
    });
    snapPhotoButton.addEventListener('click', () => {
        viewfinder.classList.add('shutter-flash');
        setTimeout(() => viewfinder.classList.remove('shutter-flash'), 200);

        const gallery = document.getElementById('session-gallery');
        if (!gallery) return;

        const thumbWrapper = document.createElement('div');
        thumbWrapper.className = 'captured-thumb';

        const clone = viewfinder.cloneNode(true);

        const ui = clone.querySelector('.camera-ui-overlay');
        if (ui) ui.remove();

        const origPinwheel = viewfinder.querySelector('#pinwheel');
        const clonedPinwheel = clone.querySelector('#pinwheel');
        if (origPinwheel && clonedPinwheel) {
            clonedPinwheel.style.transform = window.getComputedStyle(origPinwheel).transform;
            clonedPinwheel.style.animation = 'none';
        }

        const origGhosts = viewfinder.querySelectorAll('.pinwheel-trail-ghost');
        const clonedGhosts = clone.querySelectorAll('.pinwheel-trail-ghost');
        origGhosts.forEach((ghost, i) => {
            if (clonedGhosts[i]) {
                const style = window.getComputedStyle(ghost);
                clonedGhosts[i].style.transform = style.transform;
                clonedGhosts[i].style.opacity = style.opacity;
                clonedGhosts[i].style.filter = style.filter;
            }
        });

        // Înghețăm zgomotul de imagine (grain-ul)
        const clonedNoiseSVG = clone.querySelector('.noise-overlay svg');
        if (clonedNoiseSVG) {
            clonedNoiseSVG.style.animation = 'none'; // Îl ștergem complet în loc de pauză
        }

        clone.removeAttribute('id');

        thumbWrapper.appendChild(clone);
        gallery.prepend(thumbWrapper);

        if (gallery.children.length > 6) {
            gallery.lastChild.remove();
        }

        // Click pe thumbnail pentru ecran complet
        thumbWrapper.addEventListener('click', () => {
            const modal = document.getElementById('photo-modal');
            const modalBody = document.getElementById('photo-modal-body');
            modalBody.innerHTML = ''; 
            
            const enlargedClone = clone.cloneNode(true);
            
            // FIX: Ne asigurăm că și în poza mărită (modală) animația SVG-ului este ștearsă complet
            const enlargedNoiseSVG = enlargedClone.querySelector('.noise-overlay svg');
            if (enlargedNoiseSVG) {
                enlargedNoiseSVG.style.animation = 'none';
            }
            
            modalBody.appendChild(enlargedClone);
            modal.classList.add('active');
        });
        clone.removeAttribute('id');

        thumbWrapper.appendChild(clone);
        gallery.prepend(thumbWrapper);

        if (gallery.children.length > 6) {
            gallery.lastChild.remove();
        }

        thumbWrapper.addEventListener('click', () => {
            const modal = document.getElementById('photo-modal');
            const modalBody = document.getElementById('photo-modal-body');
            modalBody.innerHTML = ''; 
            
            const enlargedClone = clone.cloneNode(true);
            modalBody.appendChild(enlargedClone);
            modal.classList.add('active');
        });
    });

    const closeModalBtn = document.getElementById('close-modal');
    const photoModal = document.getElementById('photo-modal');

    function closePhotoModal() {
        photoModal.classList.add('closing');
        setTimeout(() => {
            photoModal.classList.remove('active');
            photoModal.classList.remove('closing');
        }, 400);
    }

    if (closeModalBtn && photoModal) {
        closeModalBtn.addEventListener('click', closePhotoModal);
        photoModal.addEventListener('click', (e) => {
            if (e.target === photoModal) {
                closePhotoModal();
            }
        });
    }
    function init() {
        apertureSlider.max = APERTURE_STOPS.length - 1;
        shutterSlider.max = SHUTTER_STOPS.length - 1;
        isoSlider.max = ISO_STOPS.length - 1;
        apertureSlider.value = 4;
        shutterSlider.value = 7;
        isoSlider.value = 2;
        pinwheel.style.animationDuration = `${PINWHEEL_ROTATION_SPEED}s`;
        createTrailGhosts();
        updateSimulator();
    }
    init();
});