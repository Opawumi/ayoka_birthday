/* ==========================================================================
   AYOKA'S BIRTHDAY CELEBRATION - JAVASCRIPT
   Interactive Behaviors, Ambient Audio Synthesizer,
   Gallery Filter & Lightbox, and Cinematic Animations
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initNavbarScroll();
  initScrollReveals();
  initParticlesCanvas();
  initAmbientAudio();
  initVoiceLetterPlayer();
  initInteractiveGallery();
  initSmoothScrollActions();
});

/* ==========================================================================
   1. NAVBAR SCROLL EFFECT
   ========================================================================== */
function initNavbarScroll() {
  const nav = document.querySelector('.top-nav');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }, { passive: true });
}

/* ==========================================================================
   2. SCROLL REVEALS (Intersection Observer)
   ========================================================================== */
function initScrollReveals() {
  const elements = document.querySelectorAll('.reveal-on-scroll');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        // Once revealed, unobserve to save performance
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  elements.forEach(el => observer.observe(el));
}

/* ==========================================================================
   3. BACKGROUND PARTICLES CANVAS (Warm romantic stardust & petals)
   ========================================================================== */
function initParticlesCanvas() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  const PARTICLE_COUNT = 32;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resize);
  resize();

  class Particle {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : -20;
      this.size = Math.random() * 3.5 + 1.5;
      this.speedY = Math.random() * 0.45 + 0.2;
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.opacity = Math.random() * 0.4 + 0.15;
      this.rotation = Math.random() * 360;
      this.rotSpeed = (Math.random() - 0.5) * 0.8;
      // Palette: Soft gold, warm rose, creamy blush
      const colors = ['223, 192, 137', '216, 140, 153', '232, 208, 211', '197, 157, 95'];
      this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
      this.y += this.speedY;
      this.x += this.speedX + Math.sin(this.y * 0.01) * 0.2;
      this.rotation += this.rotSpeed;

      if (this.y > height + 20) {
        this.reset();
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate((this.rotation * Math.PI) / 180);
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color}, ${this.opacity})`;
      ctx.fill();
      ctx.restore();
    }
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle());
  }

  let animationFrameId;
  function animate() {
    ctx.clearRect(0, 0, width, height);
    for (let p of particles) {
      p.update();
      p.draw();
    }
    animationFrameId = requestAnimationFrame(animate);
  }


  
  animate();
}

/* ==========================================================================
   4. AMBIENT AUDIO SYNTHESIZER & PLAYER
   A gentle, warm, romantic acoustic piano progression
   Played with Web Audio API (zero copyright, zero external dependency)
   Supports external audio file seamlessly if present.
   ========================================================================== */
function initAmbientAudio() {
  const pill = document.getElementById('audio-player-pill');
  const btn = document.getElementById('audio-toggle-btn');
  const label = document.getElementById('audio-label');
  const fallbackAudio = document.getElementById('bg-audio');

  if (!pill || !btn) return;

  let isPlaying = false;
  let audioCtx = null;
  let synthInterval = null;

  // Chord progression: Cmaj7 -> Am9 -> Fmaj7 -> G6
  const chords = [
    // Cmaj7 (C3, G3, B3, E4, G4)
    [130.81, 196.00, 246.94, 329.63, 392.00],
    // Am9 (A2, E3, G3, C4, B4)
    [110.00, 164.81, 196.00, 261.63, 493.88],
    // Fmaj7 (F2, C3, A3, E4, A4)
    [87.31, 130.81, 220.00, 329.63, 440.00],
    // G6 (G2, D3, B3, E4, G4)
    [98.00, 146.83, 246.94, 329.63, 392.00]
  ];

  let currentChordIndex = 0;

  function playPianoNote(ctx, freq, startTime, duration = 3.5, gainVal = 0.08) {
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // Warm Rhodes/Piano timbre
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 1.001, startTime); // slight gentle detune

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(950, startTime);
    filter.frequency.exponentialRampToValueAtTime(320, startTime + duration);

    gain.gain.setValueAtTime(0.0001, startTime);
    // Soft attack
    gain.gain.linearRampToValueAtTime(gainVal, startTime + 0.08);
    // Long gentle decay
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc2.start(startTime);
    osc.stop(startTime + duration);
    osc2.stop(startTime + duration);
  }

  function playNextChord() {
    if (!audioCtx || !isPlaying) return;
    const now = audioCtx.currentTime;
    const chord = chords[currentChordIndex];

    // Arpeggiate notes gently
    chord.forEach((freq, idx) => {
      const noteDelay = idx * 0.18; // soft rolling arpeggio
      playPianoNote(audioCtx, freq, now + noteDelay, 4.2, 0.065);
    });

    currentChordIndex = (currentChordIndex + 1) % chords.length;
  }

  function startSynthesizer() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    currentChordIndex = 0;
    playNextChord();
    synthInterval = setInterval(playNextChord, 3800);
  }

  function stopSynthesizer() {
    if (synthInterval) {
      clearInterval(synthInterval);
      synthInterval = null;
    }
  }

  btn.addEventListener('click', () => {
    const voiceAudio = document.getElementById('voice-audio');
    // Check if an external audio file is available and playable
    const hasSource = fallbackAudio && (fallbackAudio.getAttribute('src') || fallbackAudio.querySelector('source') || fallbackAudio.currentSrc);

    if (hasSource) {
      if (fallbackAudio.paused) {
        // Pause voice note player if currently playing
        if (voiceAudio && !voiceAudio.paused) {
          voiceAudio.pause();
          const voiceIcon = document.getElementById('voice-icon-state');
          const voiceLabel = document.getElementById('voice-btn-label');
          if (voiceIcon) voiceIcon.textContent = '▶';
          if (voiceLabel) voiceLabel.textContent = 'Play Song';
        }

        fallbackAudio.play().then(() => {
          isPlaying = true;
          pill.classList.add('playing');
          if (label) label.textContent = 'Pause Music';
        }).catch(() => {
          toggleWebAudio();
        });
      } else {
        fallbackAudio.pause();
        isPlaying = false;
        pill.classList.remove('playing');
        if (label) label.textContent = '♫ Ayoka\'s Song';
      }
    } else {
      toggleWebAudio();
    }
  });

  function playSong() {
    const voiceAudio = document.getElementById('voice-audio');
    const hasSource = fallbackAudio && (fallbackAudio.getAttribute('src') || fallbackAudio.querySelector('source') || fallbackAudio.currentSrc);

    if (hasSource) {
      if (fallbackAudio.paused) {
        if (voiceAudio && !voiceAudio.paused) {
          voiceAudio.pause();
          const voiceIcon = document.getElementById('voice-icon-state');
          const voiceLabel = document.getElementById('voice-btn-label');
          if (voiceIcon) voiceIcon.textContent = '▶';
          if (voiceLabel) voiceLabel.textContent = 'Play Song';
        }

        fallbackAudio.play().then(() => {
          isPlaying = true;
          pill.classList.add('playing');
          if (label) label.textContent = 'Pause Music';
        }).catch((err) => {
          console.log('Autoplay waiting for initial touch/gesture:', err);
        });
      }
    } else {
      if (!isPlaying) toggleWebAudio();
    }
  }

  window.playAyokaSong = playSong;

  function toggleWebAudio() {
    if (isPlaying) {
      stopSynthesizer();
      isPlaying = false;
      pill.classList.remove('playing');
      if (label) label.textContent = '♫ Ayoka\'s Song';
    } else {
      startSynthesizer();
      isPlaying = true;
      pill.classList.add('playing');
      if (label) label.textContent = 'Playing Music';
    }
  }

  // Expose startSynthesizer gently for background accompaniment
  window.playAmbientSoundtrack = function() {
    if (!isPlaying) {
      playSong();
    }
  };

  // 1. Autoplay on initial user interaction (click, touch, or key)
  const unlockAudioEvents = ['click', 'touchstart', 'scroll', 'keydown'];
  function unlockOnUserGesture() {
    playSong();
    unlockAudioEvents.forEach(evt => window.removeEventListener(evt, unlockOnUserGesture));
  }
  unlockAudioEvents.forEach(evt => window.addEventListener(evt, unlockOnUserGesture, { once: true, passive: true }));

  // 2. Autoplay specifically when scrolling to second section (Chapter 25 / Childhood) and the Letter part
  const targetSections = [
    document.getElementById('section-chapter25'),
    document.getElementById('section-childhood'),
    document.getElementById('section-letter')
  ].filter(Boolean);

  if (targetSections.length && 'IntersectionObserver' in window) {
    const scrollAudioObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          playSong();
          // If entering the letter section and audio is playing, gently ensure full volume
          if (entry.target.id === 'section-letter' && fallbackAudio) {
            fallbackAudio.volume = 1.0;
          }
        }
      });
    }, {
      threshold: 0.2
    });

    targetSections.forEach(sec => scrollAudioObserver.observe(sec));
  }
}

/* ==========================================================================
   4B. VOICE LETTER PLAYER (Ayoka's Dedicated Soundtrack / Message)
   ========================================================================== */
function initVoiceLetterPlayer() {
  const playBtn = document.getElementById('voice-play-btn');
  const iconState = document.getElementById('voice-icon-state');
  const label = document.getElementById('voice-btn-label');
  const progressBar = document.getElementById('voice-progress-bar');
  const progressContainer = document.getElementById('voice-progress-container');
  const timeDisplay = document.getElementById('voice-time-display');
  const voiceAudio = document.getElementById('voice-audio');
  const bgAudio = document.getElementById('bg-audio');

  if (!playBtn || !voiceAudio) return;

  function formatTime(seconds) {
    if (isNaN(seconds) || seconds <= 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  voiceAudio.addEventListener('loadedmetadata', () => {
    if (timeDisplay) timeDisplay.textContent = formatTime(voiceAudio.duration);
  });

  voiceAudio.addEventListener('timeupdate', () => {
    if (!voiceAudio.duration) return;
    const progressPercent = (voiceAudio.currentTime / voiceAudio.duration) * 100;
    if (progressBar) progressBar.style.width = `${progressPercent}%`;
    if (timeDisplay) timeDisplay.textContent = formatTime(voiceAudio.currentTime);
  });

  voiceAudio.addEventListener('ended', () => {
    if (iconState) iconState.textContent = '▶';
    if (label) label.textContent = 'Replay Song';
    if (progressBar) progressBar.style.width = '0%';
  });

  playBtn.addEventListener('click', () => {
    if (voiceAudio.paused) {
      // Pause top ambient player if playing
      if (bgAudio && !bgAudio.paused) {
        bgAudio.pause();
        const pill = document.getElementById('audio-player-pill');
        if (pill) pill.classList.remove('playing');
        const bgLabel = document.getElementById('audio-label');
        if (bgLabel) bgLabel.textContent = '♫ Ayoka\'s Song';
      }

      voiceAudio.play().then(() => {
        if (iconState) iconState.textContent = '⏸';
        if (label) label.textContent = 'Pause Song';
      }).catch((err) => {
        console.warn('Audio play request:', err);
        // Fallback to ambient synthesized soundtrack
        if (typeof window.playAmbientSoundtrack === 'function') {
          window.playAmbientSoundtrack();
        }
      });
    } else {
      voiceAudio.pause();
      if (iconState) iconState.textContent = '▶';
      if (label) label.textContent = 'Play Song';
    }
  });

  // Click on progress bar to scrub
  if (progressContainer) {
    progressContainer.addEventListener('click', (e) => {
      if (!voiceAudio.duration) return;
      const rect = progressContainer.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const seekTime = (clickX / width) * voiceAudio.duration;
      voiceAudio.currentTime = seekTime;
    });
  }
}

/* ==========================================================================
   5. INTERACTIVE GALLERY & FULLSCREEN LIGHTBOX
   ========================================================================== */
let allGalleryItems = [];
let filteredGalleryItems = [];
let currentLightboxIndex = 0;

async function initInteractiveGallery() {
  const grid = document.getElementById('gallery-grid');
  const filters = document.querySelectorAll('.filter-btn');
  if (!grid) return;

  try {
    const res = await fetch('images/gallery_data.json');
    allGalleryItems = await res.json();
  } catch (e) {
    console.warn('Could not load gallery_data.json, using fallback data');
    allGalleryItems = getFallbackGallery();
  }

  filteredGalleryItems = [...allGalleryItems];
  renderGalleryGrid(filteredGalleryItems);
  initLightbox();

  // Filters logic
  filters.forEach(btn => {
    btn.addEventListener('click', () => {
      filters.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const category = btn.getAttribute('data-filter');
      if (category === 'all') {
        filteredGalleryItems = [...allGalleryItems];
      } else {
        filteredGalleryItems = allGalleryItems.filter(item => item.category === category);
      }
      renderGalleryGrid(filteredGalleryItems);
    });
  });

  // Attach lightbox click events to static photos throughout the page as well!
  attachStaticPhotoLightbox();
}

function renderGalleryGrid(items) {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;

  grid.innerHTML = '';
  items.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'gallery-item reveal-on-scroll';
    card.setAttribute('data-index', index);
    card.innerHTML = `
      <img src="${item.path}" alt="${item.title}" loading="lazy" />
      <div class="gallery-item-overlay">
        <h4>${item.title}</h4>
        <p>${item.description}</p>
      </div>
    `;

    card.addEventListener('click', () => {
      openLightbox(index, filteredGalleryItems);
    });

    grid.appendChild(card);
  });

  // Re-observe newly rendered items
  initScrollReveals();
}

/* Lightbox Logic */
function initLightbox() {
  const modal = document.getElementById('lightbox-modal');
  const closeBtn = document.getElementById('lightbox-close');
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');

  if (!modal) return;

  closeBtn?.addEventListener('click', closeLightbox);
  prevBtn?.addEventListener('click', showPrevImage);
  nextBtn?.addEventListener('click', showNextImage);

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeLightbox();
  });

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showPrevImage();
    if (e.key === 'ArrowRight') showNextImage();
  });

  // Touch swipe support for mobile devices
  let touchStartX = 0;
  let touchEndX = 0;

  modal.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  modal.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }, { passive: true });

  function handleSwipe() {
    const diff = touchEndX - touchStartX;
    if (Math.abs(diff) > 45) {
      if (diff > 0) {
        showPrevImage();
      } else {
        showNextImage();
      }
    }
  }
}

let activeLightboxSet = [];

function openLightbox(index, itemSet = allGalleryItems) {
  const modal = document.getElementById('lightbox-modal');
  if (!modal) return;

  activeLightboxSet = itemSet;
  currentLightboxIndex = index;
  updateLightboxContent();

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const modal = document.getElementById('lightbox-modal');
  if (!modal) return;

  modal.classList.remove('active');
  document.body.style.overflow = '';
}

function showPrevImage() {
  if (!activeLightboxSet.length) return;
  currentLightboxIndex = (currentLightboxIndex - 1 + activeLightboxSet.length) % activeLightboxSet.length;
  updateLightboxContent();
}

function showNextImage() {
  if (!activeLightboxSet.length) return;
  currentLightboxIndex = (currentLightboxIndex + 1) % activeLightboxSet.length;
  updateLightboxContent();
}

function updateLightboxContent() {
  const imgEl = document.getElementById('lightbox-img');
  const titleEl = document.getElementById('lightbox-title');
  const descEl = document.getElementById('lightbox-desc');
  const counterEl = document.getElementById('lightbox-counter');

  const item = activeLightboxSet[currentLightboxIndex];
  if (!item) return;

  if (imgEl) {
    imgEl.style.opacity = '0';
    imgEl.src = item.path;
    imgEl.onload = () => {
      imgEl.style.opacity = '1';
    };
  }

  if (titleEl) titleEl.textContent = item.title;
  if (descEl) descEl.textContent = item.description;
  if (counterEl) {
    counterEl.textContent = `${currentLightboxIndex + 1} / ${activeLightboxSet.length}`;
  }
}

function attachStaticPhotoLightbox() {
  // Allow clicking on any hero, polaroid, music, unilorin, or couple card to open it in lightbox
  const clickableCards = document.querySelectorAll('[data-lightbox-src]');
  clickableCards.forEach(card => {
    card.addEventListener('click', () => {
      const src = card.getAttribute('data-lightbox-src');
      const title = card.getAttribute('data-lightbox-title') || 'Ayoka';
      const desc = card.getAttribute('data-lightbox-desc') || '';

      const customItem = [{ path: src, title: title, description: desc }];
      openLightbox(0, customItem);
    });
  });
}

/* ==========================================================================
   6. SMOOTH SCROLL ACTIONS (Hero CTA & Replay Button)
   ========================================================================== */
function initSmoothScrollActions() {
  const walkBtn = document.getElementById('hero-walk-btn');
  if (walkBtn) {
    walkBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof window.playAyokaSong === 'function') {
        window.playAyokaSong();
      }
      const firstSection = document.getElementById('section-chapter25') || document.getElementById('section-childhood');
      if (firstSection) {
        firstSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  const replayBtn = document.getElementById('replay-story-btn');
  if (replayBtn) {
    replayBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
}

/* Fallback gallery data if JSON fails to fetch */
function getFallbackGallery() {
  return [
    { path: 'images/hero_red_dress.jpg', title: 'Radiant in Red', description: 'The woman of today—breathtaking and poised.', category: 'photoshoot' },
    { path: 'images/photoshoot_white_satin.jpg', title: 'Pure Elegance', description: 'Grace, charm, and that timeless smile.', category: 'photoshoot' },
    { path: 'images/birthday_roses_pool.jpg', title: 'Roses for the Queen', description: 'Crimson roses under clear blue skies.', category: 'celebration' },
    { path: 'images/us_sweet_smile.jpg', title: 'Where My Heart Resides', description: 'Together since 2019, my favorite place.', category: 'us' }
  ];
}
