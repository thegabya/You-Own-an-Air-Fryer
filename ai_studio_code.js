document.addEventListener('DOMContentLoaded', function() {

    const beginButton = document.getElementById('beginButton');
    const getUpButton = document.getElementById('getUpButton');
    const approachMirrorButton = document.getElementById('approachMirrorButton');
    const initialInterface = document.getElementById('initial-interface');
    const hudContainer = document.getElementById('hud-container');
    const hudElements = document.querySelectorAll('.hud-element');
    const backgroundImageContainer = document.getElementById('background-image-container');
    const bootSound = document.getElementById('bootSound');
    const computerSound = document.getElementById('computerSound');
    const footstepsSound = document.getElementById('footstepsSound');
    const dataStreams = document.querySelectorAll('.data-stream-1, .data-stream-2');
    const jarvisBathroomSound = document.getElementById('jarvisbathroom1');
    const jarvisBathroomSound2 = document.getElementById('jarvisbathroom2');
    const jarvisBathroomSound3 = document.getElementById('jarvisbathroom3');
    const boomSound = document.getElementById('boomSound'); // NEW
    const jarvisKitchenSound = document.getElementById('jarviskitchen1');
    const jarvisKitchen2Sound = document.getElementById('jarviskitchen2');

    // Set playback rates: bootSound should be decreased to 1.05 (5% faster than real-time),
    // Jarvis bathroom clips remain at 1.10 (10% faster).
    [bootSound, jarvisBathroomSound, jarvisBathroomSound2, jarvisBathroomSound3].forEach(a => {
        if (!a) return;
        if (a === bootSound) {
            a.playbackRate = 1.05; // bootSound reduced to ~5% faster
        } else {
            a.playbackRate = 1.10; // jarvis lines at ~10% faster
        }
    });

    let mirrorApproachCount = 0;
    // When we play an intentionally sped-up footsteps instance we set this flag
    // so the main 'ended' handler doesn't restart the bathroom scene.
    let ignoreNextFootstepsEnd = false;

    // The target status span in the HUD that reads the AIR FRYER status.
    const targetStatusSpan = document.querySelector('.target-display span');

    // --- BOOT SEQUENCE ---
    beginButton.addEventListener('click', function() {
        initialInterface.classList.add('fade-out');
        setTimeout(() => {
            initialInterface.style.display = 'none';
            hudContainer.classList.add('booting-up', 'visible');

            setTimeout(() => {
                backgroundImageContainer.style.transitionDuration = '12s';
                backgroundImageContainer.style.opacity = '1';
            }, 3000);

            bootSound.play();
            computerSound.volume = 0.3;
            computerSound.play();
            setTimeout(() => fadeOutAudio(computerSound), 15000);
        }, 1000);
    });

    bootSound.addEventListener('ended', () => {
        getUpButton.classList.add('visible');
    });

    // --- GETTING UP ---
    getUpButton.addEventListener('click', function() {
        hudContainer.classList.remove('visible');
        getUpButton.classList.remove('visible');
        setTimeout(() => {
            backgroundImageContainer.style.transitionDuration = '1s';
            backgroundImageContainer.style.backgroundImage = "url('blackscreen.jpg')";
            footstepsSound.playbackRate = 0.75;
            footstepsSound.play();
        }, 1000);
    });

    // --- ENTER BATHROOM SCENE ---
    footstepsSound.addEventListener('ended', function() {
        // If we intentionally played a sped-up footsteps instance and set the
        // ignore flag, consume this 'ended' event here and do not restart the
        // bathroom scene. The flag is reset so future normal endings behave
        // normally.
        if (ignoreNextFootstepsEnd) { ignoreNextFootstepsEnd = false; return; }
        mirrorApproachCount = 0;
        backgroundImageContainer.style.transform = 'scale(1.0)';
        hudContainer.classList.remove('booting-up');
        // Ensure any previous full-screen black overlay (from the boom/flash)
        // is removed so the bathroom background is visible.
        const existingOverlay = document.getElementById('global-black-overlay');
        if (existingOverlay) {
            try {
                existingOverlay.style.transition = 'opacity 300ms ease-out';
                existingOverlay.style.opacity = '0';
                setTimeout(() => { if (existingOverlay.parentNode) existingOverlay.parentNode.removeChild(existingOverlay); }, 350);
            } catch (e) {
                if (existingOverlay.parentNode) existingOverlay.parentNode.removeChild(existingOverlay);
            }
        }
        // Re-apply the bathroom background (ensure correct image path/extension)
        backgroundImageContainer.style.backgroundImage = "url('tonysbathroom.png')";
        backgroundImageContainer.style.backgroundPosition = 'center center';
        dataStreams.forEach(s => s.style.animation = 'none');
        hudElements.forEach(e => e.style.opacity = '0.75');
        setTimeout(() => {
            backgroundImageContainer.style.transition = 'opacity 1s ease-in-out';
            hudContainer.classList.add('visible');
            backgroundImageContainer.style.opacity = '1';
            setTimeout(() => jarvisBathroomSound.play(), 1500);
        }, 50);
    });

    jarvisBathroomSound.addEventListener('ended', () => {
        approachMirrorButton.classList.add('visible');
    });

    // --- APPROACH MIRROR (ZOOMS) ---
    approachMirrorButton.addEventListener('click', function() {
        approachMirrorButton.classList.remove('visible');
        mirrorApproachCount++;

        const zoomDuration = 2;
        const targetScale = 1.0 + (mirrorApproachCount * 0.5);

        backgroundImageContainer.style.transition = `opacity 1s ease-in-out, transform ${zoomDuration}s linear`;
        backgroundImageContainer.style.transform = `scale(${targetScale})`;

        footstepsSound.currentTime = 0;
        footstepsSound.play();
        setTimeout(() => footstepsSound.pause(), 2000);

        // Play corresponding JARVIS line after zoom completes
        setTimeout(() => {
            if (mirrorApproachCount === 1) {
                jarvisBathroomSound2.play();
            } else if (mirrorApproachCount === 2) {
                jarvisBathroomSound3.play();
            }
        }, zoomDuration * 1000);
    });

    jarvisBathroomSound2.addEventListener('ended', () => {
        approachMirrorButton.classList.add('visible');
    });

    // --- After the final JARVIS line, show LOOK UP button instead ---
    jarvisBathroomSound3.addEventListener('ended', () => {
        approachMirrorButton.classList.remove('visible');

        // Create the LOOK UP button dynamically
        const lookUpButton = document.createElement('button');
        lookUpButton.id = 'lookUpButton';
        lookUpButton.className = 'hud-button visible';
        lookUpButton.textContent = 'LOOK UP';
        hudContainer.appendChild(lookUpButton);

        lookUpButton.addEventListener('click', () => {
            lookUpButton.classList.remove('visible');

            // Preserve the current zoom (scale) and only pan vertically into the image's
            // middle third. We read the computed transform matrix to extract the current scale
            // so the pan doesn't reset the zoom level.
            const cs = window.getComputedStyle(backgroundImageContainer);
            const transform = cs.transform || cs.webkitTransform || 'none';
            let currentScale = 1;
            if (transform && transform !== 'none') {
                const m = transform.match(/matrix\(([^)]+)\)/);
                if (m) {
                    const values = m[1].split(',').map(v => parseFloat(v));
                    // matrix(a, b, c, d, e, f) -> scaleX = a
                    if (!isNaN(values[0])) currentScale = values[0];
                }
            }

            // Change the transform-origin to the center so scaling centers on the
            // middle of the image. Then animate the background-position upward so
            // the user perceives a "looking up" motion. We keep the current scale.
            backgroundImageContainer.style.transformOrigin = 'center center';

            // Target: move much higher so the shot clearly looks up. A larger
            // negative percentage pushes the image further up relative to the container.
            const targetBgPos = 'center -120%';

            // Visible, smooth transition so the movement reads as a deliberate
            // "looking up" motion. Shorten slightly for responsiveness but keep
            // it smooth. We'll play the boom earlier (40% through) so the sound
            // doesn't wait until the very end.
            const panDurationMs = 800;
            const easing = 'cubic-bezier(0.22, 1, 0.36, 1)';
            backgroundImageContainer.style.transition = `transform ${panDurationMs}ms ${easing}, background-position ${panDurationMs}ms ${easing}`;
            backgroundImageContainer.style.backgroundPosition = targetBgPos;
            // Re-apply the same scale so we remain zoomed in and centered during the pan.
            backgroundImageContainer.style.transform = `scale(${currentScale})`;

            // Play boom earlier (at ~40% of duration) so it doesn't make the
            // sequence feel long, but keep a transitionend fallback to ensure
            // it fires if the timeout is delayed.
            let boomPlayed = false;
            const playBoom = () => {
                if (boomPlayed) return;
                boomPlayed = true;
                try { boomSound.currentTime = 0; } catch (e) {}
                boomSound.play();

                // FLASH: quickly show the 'clearlymirror' image (fade in/out)
                // during the boom, then fade all visuals to black when it finishes.
                // Assumption: image file is 'clearlymirror.jpg' located in the project root.
                (function flashClearlyMirror() {
                    if (!backgroundImageContainer) return;

                    // Avoid duplicate flashes
                    if (document.getElementById('clearlymirror-flash')) return;

                    const flashDelayMs = 300; // delay before the flash appears

                    setTimeout(() => {
                        const flashImg = document.createElement('img');
                        flashImg.id = 'clearlymirror-flash';
                        flashImg.src = 'clearlymirror.jpg';
                        // Style to center and overlay above HUD
                        Object.assign(flashImg.style, {
                            position: 'absolute',
                            top: '47%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            // smaller flash image (30% smaller than before)
                            maxWidth: '42%',
                            maxHeight: '42%',
                            width: 'auto',
                            height: 'auto',
                            opacity: '0',
                            pointerEvents: 'none',
                            zIndex: '30',
                            // make the appearance a smoother, slower fade-in
                            transition: 'opacity 400ms ease-out'
                        });
                        backgroundImageContainer.appendChild(flashImg);

                        // trigger fade-in (quick but smooth) to 60% opacity
                        requestAnimationFrame(() => {
                            flashImg.style.opacity = '0.6';
                        });

                        // timings: slower fade-in so the clearlymirror fades in rather
                        // than hard-flashing; fade-in is now 400ms
                        const fadeInMs = 400;
                        const holdMs = 160;
                        const overlayFadeMs = 600; // overlay fade duration
                        const fadeOutMs = overlayFadeMs; // make flash fade-out match overlay

                        const startOverlayAt = fadeInMs + holdMs; // when to start overlay & flash fade-out
                        const removeAt = startOverlayAt + overlayFadeMs; // when to remove flash

                        // After hold, fade out flash. Previously we faded the whole
                        // screen to black here; per request that visual fade is
                        // removed. We'll instead show 'blackscreen.jpg' over the
                        // content at the moment the sped-up footsteps play.
                        setTimeout(() => {
                            flashImg.style.transition = `opacity ${fadeOutMs}ms ease-out`;
                            flashImg.style.opacity = '0';
                        }, startOverlayAt);

                        // After overlay fade completes, remove the flash element
                        setTimeout(() => {
                            if (flashImg && flashImg.parentNode) flashImg.parentNode.removeChild(flashImg);
                        }, removeAt);

                        // Play sped-up footsteps immediately after the clearlymirror has faded OUT.
                        // Schedule at the time the flash fade-out completes (removeAt - overlayFadeMs + fadeOutMs,
                        // which simplifies to removeAt because fadeOutMs === overlayFadeMs).
                        setTimeout(() => {
                            if (footstepsSound) {
                                // Prevent the main footsteps 'ended' handler from
                                // restarting the bathroom scene for this sped-up play.
                                ignoreNextFootstepsEnd = true;
                                // While the sped-up footsteps play, switch the
                                // background to the kitchen image.
                                try {
                                    // Instead of directly swapping the background on the
                                    // container (which causes the kitchen to appear twice
                                    // once we also append an overlay), create a kitchen1
                                    // overlay and fade it in. This provides a clean
                                    // crossfade from the bathroom -> kitchen1.
                                    let k1early = document.getElementById('tonyskitchen1-overlay');
                                    if (!k1early) {
                                        k1early = document.createElement('div');
                                        k1early.id = 'tonyskitchen1-overlay';
                                        Object.assign(k1early.style, {
                                            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
                                            backgroundImage: "url('tonyskitchen1.jpg')",
                                            // match k2 sizing so crossfade doesn't visibly shift scale
                                            backgroundSize: '120% auto', backgroundRepeat: 'no-repeat', backgroundPosition: 'center center',
                                            opacity: '0', transition: 'opacity 1000ms ease-in-out', pointerEvents: 'none', zIndex: '4'
                                        });
                                        document.body.appendChild(k1early);
                                        // flush and fade in quickly so it replaces the bathroom
                                        void k1early.offsetWidth;
                                        requestAnimationFrame(() => { k1early.style.opacity = '1'; });
                                    } else {
                                        k1early.style.display = 'block';
                                        k1early.style.opacity = '1';
                                        // ensure it will participate in the longer crossfade later
                                        k1early.style.transition = 'opacity 1000ms ease-in-out';
                                    }
                                    // reset any transform on the background container for proper framing
                                    backgroundImageContainer.style.transform = 'scale(1.0)';
                                } catch (e) {}
                                // Show 'blackscreen.jpg' over everything while the
                                // sped-up footsteps play. We'll create a full-screen
                                // image element and remove it when the footsteps end.
                                let bsImg = document.getElementById('global-blackscreen-img');
                                if (!bsImg) {
                                    bsImg = document.createElement('img');
                                    bsImg.id = 'global-blackscreen-img';
                                    bsImg.src = 'blackscreen.jpg';
                                    Object.assign(bsImg.style, {
                                        position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
                                        objectFit: 'cover', zIndex: '45', pointerEvents: 'none'
                                    });
                                    document.body.appendChild(bsImg);
                                } else {
                                    bsImg.style.display = 'block';
                                }
                                const prevRate = footstepsSound.playbackRate || 1;
                                try {
                                    // Set footsteps to 50% faster than its current rate
                                    footstepsSound.playbackRate = prevRate * 1.5;
                                    footstepsSound.currentTime = 0;
                                } catch (e) {}
                                footstepsSound.play();
                                const restoreFoot = () => {
                                    try { footstepsSound.playbackRate = prevRate; } catch (e) {}
                                    // restore the flag in case it wasn't consumed for
                                    // some reason
                                    ignoreNextFootstepsEnd = false;
                                    // remove the blackscreen image we added
                                    try {
                                        const bsi = document.getElementById('global-blackscreen-img');
                                        if (bsi && bsi.parentNode) bsi.parentNode.removeChild(bsi);
                                    } catch (e) {}

                                    // Update the HUD text and color, and play the kitchen Jarvis line
                                    try {
                                        if (targetStatusSpan) {
                                            targetStatusSpan.textContent = 'AIR FRYER SYSTEM: ESTABLISHING CONNECTION';
                                            // make the status match the HUD blue
                                            targetStatusSpan.style.color = '#00ffff';
                                            // change glow to yellow for establishing
                                            targetStatusSpan.style.textShadow = '0 0 7px #ffff66, 0 0 12px #ffd700';
                                        }
                                        if (jarvisKitchenSound) {
                                            try { jarvisKitchenSound.currentTime = 0; } catch (e) {}
                                            jarvisKitchenSound.play();
                                        }

                                        // Also begin playing the first 5 seconds of the old computer boot
                                        // sound simultaneously with the Jarvis kitchen line.
                                        try {
                                            if (computerSound) {
                                                try { computerSound.currentTime = 0; } catch (e) {}
                                                try { computerSound.volume = 0.3; } catch (e) {}
                                                const playPromise = computerSound.play();
                                                if (playPromise && playPromise.then) {
                                                    playPromise.catch(() => {/* ignore play errors (autoplay) */});
                                                }

                                                // After ~5 seconds: pause the computer sound, fade in
                                                // tonyskitchen2 over tonyskitchen1, and update HUD text
                                                setTimeout(() => {
                                                    try { computerSound.pause(); computerSound.currentTime = 0; } catch (e) {}

                                                    // Fade in kitchen2 overlay
                                                    try {
                                                        let k2 = document.getElementById('tonyskitchen2-overlay');
                                                        if (!k2) {
                                                            k2 = document.createElement('div');
                                                            k2.id = 'tonyskitchen2-overlay';
                                                            Object.assign(k2.style, {
                                                                position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
                                                                backgroundImage: "url('tonyskitchen2.jpg')",
                                                                // make the overlay image 120% of container size
                                                                backgroundSize: '120% auto', backgroundRepeat: 'no-repeat', backgroundPosition: 'center center',
                                                                opacity: '0', transition: 'opacity 6000ms ease-in-out', pointerEvents: 'none', zIndex: '5'
                                                            });
                                                                // Before appending kitchen2, create a kitchen1 overlay so we can
                                                                // smoothly crossfade between the two images.
                                                                let k1 = document.getElementById('tonyskitchen1-overlay');
                                                                if (!k1) {
                                                                    k1 = document.createElement('div');
                                                                    k1.id = 'tonyskitchen1-overlay';
                                                                    Object.assign(k1.style, {
                                                                        position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
                                                                        backgroundImage: "url('tonyskitchen1.jpg')",
                                                                        // match k2 sizing so crossfade doesn't visibly shift scale
                                                                        backgroundSize: '120% auto', backgroundRepeat: 'no-repeat', backgroundPosition: 'center center',
                                                                        opacity: '1', transition: 'opacity 6000ms ease-in-out', pointerEvents: 'none', zIndex: '4'
                                                                    });
                                                                    document.body.appendChild(k1);
                                                                } else {
                                                                    k1.style.display = 'block';
                                                                    k1.style.opacity = '1';
                                                                    // If an earlier quick-fade was used to show k1, update
                                                                    // its transition so the slow crossfade to k2 uses 6000ms.
                                                                    try { k1.style.transition = 'opacity 6000ms ease-in-out'; } catch (e) {}
                                                                }

                                                                document.body.appendChild(k2);
                                                                // trigger crossfade: kitchen2 fades in while kitchen1 fades out
                                                                // Force a style/layout flush then animate opacity to ensure
                                                                // the browser picks up the transition on newly-inserted elements.
                                                                try {
                                                                    // ensure initial states
                                                                    k2.style.opacity = '0';
                                                                    k1.style.opacity = '1';
                                                                    // flush layout
                                                                    /* eslint-disable no-unused-expressions */
                                                                    void k2.offsetWidth;
                                                                    /* eslint-enable no-unused-expressions */
                                                                } catch (e) {}

                                                                // Small timeout to start the transition reliably
                                                                setTimeout(() => {
                                                                    k2.style.opacity = '1';
                                                                    k1.style.opacity = '0';

                                                                    // when kitchen2 starts fading in, coordinate HUD crossfades
                                                                    try {
                                                                        const textFadeMs = 3000; // half of the image crossfade (now 6000ms)
                                                                        const healthEl = document.querySelector('.data-stream-1');
                                                                        const powerEl = document.querySelector('.data-stream-2');
                                                                        // prepare transitions
                                                                        if (targetStatusSpan) targetStatusSpan.style.transition = `opacity ${textFadeMs}ms ease-in-out, color 6000ms ease-in-out, text-shadow 6000ms ease-in-out`;
                                                                        if (healthEl) healthEl.style.transition = `opacity ${textFadeMs}ms ease-in-out, color 6000ms ease-in-out, text-shadow 6000ms ease-in-out`;
                                                                        if (powerEl) powerEl.style.transition = `opacity ${textFadeMs}ms ease-in-out, color 6000ms ease-in-out, text-shadow 6000ms ease-in-out`;
                                                                        // start fade-out of current texts
                                                                        if (targetStatusSpan) targetStatusSpan.style.opacity = '0';
                                                                        if (healthEl) healthEl.style.opacity = '0';
                                                                        if (powerEl) powerEl.style.opacity = '0';
                                                                        // after half the image crossfade, swap texts/styles and fade back in
                                                                        setTimeout(() => {
                                                                            try {
                                                                                if (targetStatusSpan) {
                                                                                    targetStatusSpan.textContent = 'AIR FRYER SYSTEM: FULLY ONLINE';
                                                                                    targetStatusSpan.style.color = '#00ff00';
                                                                                    targetStatusSpan.style.textShadow = '0 0 7px #00ff00, 0 0 12px #008000';
                                                                                    targetStatusSpan.style.opacity = '1';
                                                                                }
                                                                                if (healthEl) {
                                                                                    healthEl.textContent = 'HEALTH STATUS: HEALING';
                                                                                    healthEl.style.color = '#00ff00';
                                                                                    healthEl.style.textShadow = '0 0 7px #00ff00, 0 0 12px #008000';
                                                                                    healthEl.style.opacity = '1';
                                                                                }
                                                                                if (powerEl) {
                                                                                    powerEl.textContent = 'POWER LEVEL: UNLIMITED';
                                                                                    powerEl.style.color = '#00ff00';
                                                                                    powerEl.style.textShadow = '0 0 7px #00ff00, 0 0 12px #008000';
                                                                                    powerEl.style.opacity = '1';
                                                                                }
                                                                            } catch (e) {}
                                                                        }, textFadeMs);
                                                                    } catch (e) {}
                                                                    // play jarviskitchen2 once the overlay starts appearing
                                                                    try {
                                                                        if (jarvisKitchen2Sound) { try { jarvisKitchen2Sound.currentTime = 0; } catch (e) {} ; jarvisKitchen2Sound.play(); }
                                                                    } catch (e) {}
                                                                }, 50);
                                                            // remove the k1 overlay after the crossfade completes
                                                            setTimeout(() => {
                                                                try { if (k1 && k1.parentNode) k1.parentNode.removeChild(k1); } catch (e) {}
                                                            }, 6000);
                                                        } else {
                                                            k2.style.display = 'block';
                                                            requestAnimationFrame(() => { k2.style.opacity = '1'; });
                                                            try {
                                                                if (jarvisKitchen2Sound) { try { jarvisKitchen2Sound.currentTime = 0; } catch (e) {} ; jarvisKitchen2Sound.play(); }
                                                            } catch (e) {}
                                                        }
                                                    } catch (e) {}

                                                    // Update HUD text and color to green (fully online)
                                                    try {
                                                        if (targetStatusSpan) {
                                                            targetStatusSpan.textContent = 'AIR FRYER SYSTEM: FULLY ONLINE';
                                                            targetStatusSpan.style.color = '#00ff00'; // green
                                                            // green glow when fully online
                                                            targetStatusSpan.style.textShadow = '0 0 7px #00ff00, 0 0 12px #008000';
                                                        }
                                                    } catch (e) {}
                                                }, 5000);
                                            }
                                        } catch (e) {}
                                    } catch (e) {}
                                    footstepsSound.removeEventListener('ended', restoreFoot);
                                };
                                footstepsSound.addEventListener('ended', restoreFoot);
                            }
                        }, removeAt);
                    }, flashDelayMs);
                })();
            };

            // Trigger the boom/flash slightly earlier: bring it in 0.5s sooner
            // than the previous schedule. Ensure the timeout is never negative.
            const scheduled = Math.round(panDurationMs * 0.4) - 500;
            const boomTimeout = setTimeout(playBoom, Math.max(0, scheduled));

            const onTransitionEnd = (ev) => {
                if (ev.propertyName && (ev.propertyName.includes('background-position') || ev.propertyName.includes('transform'))) {
                    clearTimeout(boomTimeout);
                    playBoom();
                    backgroundImageContainer.removeEventListener('transitionend', onTransitionEnd);
                }
            };
            backgroundImageContainer.addEventListener('transitionend', onTransitionEnd);
        });
    });

    // When jarvisKitchen2 finishes, wait 3s then fade in a final black screen
    // with an meme GIF over it while playing the first 8s of computerSound,
    // then fade out that audio.
    if (jarvisKitchen2Sound) {
        jarvisKitchen2Sound.addEventListener('ended', () => {
            setTimeout(() => {
                // Create final blackscreen element (covers everything)
                let finalBs = document.getElementById('final-blackscreen');
                    if (!finalBs) {
                    finalBs = document.createElement('div');
                    finalBs.id = 'final-blackscreen';
                    Object.assign(finalBs.style, {
                        position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
                        backgroundImage: "url('blackscreen.jpg')",
                        backgroundSize: 'cover', backgroundPosition: 'center center', backgroundRepeat: 'no-repeat',
                        opacity: '0', transition: 'opacity 3000ms ease-in-out', pointerEvents: 'none', zIndex: '200'
                    });
                    document.body.appendChild(finalBs);
                } else {
                    finalBs.style.display = 'block';
                }

                // Create the meme GIF overlay centered
                let meme = document.getElementById('airfryermeme-gif');
                if (!meme) {
                    meme = document.createElement('img');
                    meme.id = 'airfryermeme-gif';
                    meme.src = 'airfryermeme.gif';
                    Object.assign(meme.style, {
                        position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
                        maxWidth: '80%', maxHeight: '80%', width: 'auto', height: 'auto', opacity: '0',
                        transition: 'opacity 3000ms ease-in-out', pointerEvents: 'none', zIndex: '210'
                    });
                    document.body.appendChild(meme);
                } else {
                    meme.style.display = 'block';
                }

                // Start fade-in of blackscreen and gif over 3 seconds
                requestAnimationFrame(() => {
                    finalBs.style.opacity = '1';
                    meme.style.opacity = '1';
                });

                // Play first 8 seconds of computerSound during the fade-in
                if (computerSound) {
                    const originalVolume = (typeof computerSound.volume === 'number') ? computerSound.volume : 1;
                    try { computerSound.currentTime = 0; } catch (e) {}
                    try { computerSound.volume = 0.4; } catch (e) {}
                    const playP = computerSound.play();
                    if (playP && playP.catch) playP.catch(() => {});

                    // After 8s, fade out the computerSound over 1s then pause/reset
                    setTimeout(() => {
                        const fadeMs = 1000;
                        const steps = 10;
                        const stepTime = Math.max(20, Math.floor(fadeMs / steps));
                        let currentStep = 0;
                        const startVol = computerSound.volume || 0.4;
                        const volInterval = setInterval(() => {
                            currentStep++;
                            const newVol = Math.max(0, startVol * (1 - currentStep / steps));
                            try { computerSound.volume = newVol; } catch (e) {}
                            if (currentStep >= steps) {
                                clearInterval(volInterval);
                                try { computerSound.pause(); computerSound.currentTime = 0; } catch (e) {}
                                try { computerSound.volume = originalVolume; } catch (e) {}
                            }
                        }, stepTime);
                    }, 8000);
                }
            }, 3000);
        });
    }

    // --- HELPER: AUDIO FADE OUT ---
    function fadeOutAudio(audio) {
        let currentVolume = audio.volume;
        const fadeInterval = setInterval(() => {
            currentVolume -= 0.05;
            if (currentVolume > 0) {
                audio.volume = currentVolume;
            } else {
                clearInterval(fadeInterval);
                audio.pause();
            }
        }, 100);
    }
});
