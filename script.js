// Variables para Audio
let audioContext;
let audioInitialized = false;

// Configuración de los sonidos
const drumSounds = {
  'Q': { name: 'crash', type: 'cymbal', frequency: 800, decay: 1.0 },
  'E': { name: 'ride', type: 'cymbal', frequency: 600, decay: 1.0 },
  'A': { name: 'tom1', type: 'tom', frequency: 200, decay: 1.0 },
  'S': { name: 'tom2', type: 'tom', frequency: 150, decay: 1.0 },
  'D': { name: 'tom3', type: 'tom', frequency: 120, decay: 1.0 },
  'Z': { name: 'hihat', type: 'hihat', frequency: 1000, decay: 1.0 },
  'X': { name: 'kick', type: 'kick', frequency: 60, decay: 1.0 },
  'C': { name: 'snare', type: 'snare', frequency: 250, decay: 1.0 }
};

// Inicializar el AudioContext
function initAudio() {
  if (!audioInitialized) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioInitialized = true;

      // Ocultar mensaje de estado
      document.getElementById('status').classList.remove('visible');

      // Eliminar listeners de inicialización
      document.removeEventListener('click', initAudio);
      document.removeEventListener('touchstart', initAudioTouch);
      document.removeEventListener('keydown', initAudioKey);
    } catch (e) {
      console.error('Error al inicializar Web Audio API:', e);
      document.getElementById('status').textContent = 'Error: Navegador no compatible con Web Audio API';
      document.getElementById('status').classList.add('visible');
    }
  }
}

function initAudioTouch(e) {
  initAudio();
  e.preventDefault();
}

function initAudioKey(e) {
  initAudio();
}

// Mostrar mensaje para activar audio
document.getElementById('status').textContent = 'Haz clic en cualquier parte para activar el audio';
document.getElementById('status').classList.add('visible');

// Agregar listeners para inicializar audio
document.addEventListener('click', initAudio);
document.addEventListener('touchstart', initAudioTouch, { passive: false });
document.addEventListener('keydown', initAudioKey);

// Función para generar sonido de batería
function createDrumSound(type, frequency, decay) {
  if (!audioContext) {
    initAudio();
    return;
  }

  const now = audioContext.currentTime;

  // Oscilador principal
  const osc = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  const filterNode = audioContext.createBiquadFilter();

  // Configurar nodo de ganancia (volumen)
  gainNode.gain.setValueAtTime(1, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + decay);

  switch (type) {
    case 'kick':
      // Bombo: frecuencia baja con caída rápida
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, now);
      osc.frequency.exponentialRampToValueAtTime(20, now + 0.1);

      filterNode.type = 'lowpass';
      filterNode.frequency.setValueAtTime(400, now);
      break;

    case 'snare':
      // Caja: ruido con filtro
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(frequency, now);

      // Crear ruido para la caja
      const noiseNode = createNoiseNode();
      const noiseGain = audioContext.createGain();
      noiseGain.gain.setValueAtTime(0.5, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      filterNode.type = 'highpass';
      filterNode.frequency.setValueAtTime(800, now);

      noiseNode.connect(filterNode);
      filterNode.connect(audioContext.destination);
      break;

    case 'tom':
      // Tom: oscilador con filtro paso bajo
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(frequency, now);
      osc.frequency.exponentialRampToValueAtTime(frequency * 0.5, now + 0.1);

      filterNode.type = 'lowpass';
      filterNode.frequency.setValueAtTime(800, now);
      break;

    case 'hihat':
      // Hi-hat: ruido con filtro paso alto
      osc.type = 'square';
      osc.frequency.setValueAtTime(frequency, now);

      const hihatNoise = createNoiseNode();
      const hihatGain = audioContext.createGain();
      hihatGain.gain.setValueAtTime(0.3, now);
      hihatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      const hihatFilter = audioContext.createBiquadFilter();
      hihatFilter.type = 'highpass';
      hihatFilter.frequency.setValueAtTime(3000, now);

      hihatNoise.connect(hihatFilter);
      hihatFilter.connect(audioContext.destination);
      break;

    case 'cymbal':
      // Platillo: ruido con filtro y resonancia
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(frequency, now);

      const cymbalNoise = createNoiseNode();
      const cymbalGain = audioContext.createGain();
      cymbalGain.gain.setValueAtTime(0.3, now);
      cymbalGain.gain.exponentialRampToValueAtTime(0.001, now + decay);

      const cymbalFilter = audioContext.createBiquadFilter();
      cymbalFilter.type = 'bandpass';
      cymbalFilter.frequency.setValueAtTime(frequency, now);
      cymbalFilter.Q.value = 5;

      cymbalNoise.connect(cymbalFilter);
      cymbalFilter.connect(audioContext.destination);
      break;
  }

  // Conectar oscilador principal
  osc.connect(gainNode);
  gainNode.connect(filterNode);
  filterNode.connect(audioContext.destination);

  osc.start(now);
  osc.stop(now + decay);

  return osc;
}

// Función para crear nodo de ruido
function createNoiseNode() {
  const bufferSize = 2 * audioContext.sampleRate;
  const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const output = noiseBuffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  const noise = audioContext.createBufferSource();
  noise.buffer = noiseBuffer;
  noise.loop = true;
  noise.start();

  return noise;
}

// Función para reproducir un sonido
function playSound(key) {
  if (!audioInitialized) {
    initAudio();
    return;
  }

  if (key in drumSounds) {
    const sound = drumSounds[key];
    createDrumSound(sound.type, sound.frequency, sound.decay);
  }
}

// Función para manejar la animación visual
function animateDrum(key) {
  const drum = document.querySelector(`.drum[data-key="${key}"]`);
  if (drum) {
    drum.classList.add('active');
    setTimeout(() => {
      drum.classList.remove('active');
    }, 100);
  }
}

// Función para reproducir el sonido y animar
function triggerDrum(key) {
  key = key.toUpperCase();
  if (key in drumSounds) {
    playSound(key);
    animateDrum(key);
  }
}

// Event listener para teclado
document.addEventListener('keydown', function(event) {
  const key = event.key.toUpperCase();
  if (key in drumSounds) {
    triggerDrum(key);
  }
});

// Event listeners para clics/toques
const drums = document.querySelectorAll('.drum');
drums.forEach(drum => {
  // Para ratón
  drum.addEventListener('mousedown', function() {
    const key = this.getAttribute('data-key');
    triggerDrum(key);
  });

  // Para pantallas táctiles
  drum.addEventListener('touchstart', function(e) {
    e.preventDefault();
    const key = this.getAttribute('data-key');
    triggerDrum(key);
  }, { passive: false });
});

// Evitar que los eventos de tocar la pantalla hagan scroll
document.addEventListener('touchmove', function(e) {
  if (e.target.classList.contains('drum')) {
    e.preventDefault();
  }
}, { passive: false });