'use client';

import { Howl, Howler } from 'howler';

// === הגדרת סאונדים ===
const SOUND_PATHS = {
  // אמביינס
  nightAmbience: '/sounds/ambience/night.mp3',
  dayAmbience: '/sounds/ambience/day.mp3',
  tension: '/sounds/ambience/tension.mp3',

  // אפקטים
  cardDeal: '/sounds/sfx/card-deal.wav',
  cardFlip: '/sounds/sfx/card-flip.wav',
  knifeStab: '/sounds/sfx/knife-stab.wav',
  heartbeat: '/sounds/sfx/heartbeat.m4a',
  gavel: '/sounds/sfx/gavel.wav',
  crowdGasp: '/sounds/sfx/crowd-gasp.wav',
  victory: '/sounds/sfx/victory.mp3',
  defeat: '/sounds/sfx/defeat.wav',
} as const;

type SoundName = keyof typeof SOUND_PATHS;

// === מטמון סאונדים ===
const soundCache = new Map<SoundName, Howl>();
let currentAmbience: Howl | null = null;
let currentAmbienceName: SoundName | null = null;
let masterVolume = 0.7;
let isMuted = false;

/**
 * טוען סאונד למטמון (lazy loading)
 */
function getSound(name: SoundName, loop = false): Howl {
  if (soundCache.has(name)) {
    return soundCache.get(name)!;
  }

  const sound = new Howl({
    src: [SOUND_PATHS[name]],
    loop,
    volume: masterVolume,
    preload: true,
    html5: name.includes('Ambience') || name === 'tension', // streaming לקבצים גדולים
  });

  soundCache.set(name, sound);
  return sound;
}

/**
 * מנהל סאונד למשחק
 */
export const SoundManager = {
  /**
   * נגן אפקט צליל חד-פעמי
   */
  play(name: SoundName, volume?: number) {
    if (isMuted) return;
    const sound = getSound(name);
    if (volume !== undefined) {
      sound.volume(volume * masterVolume);
    }
    sound.play();
  },

  /**
   * החלף אמביינס רקע (עם crossfade)
   */
  setAmbience(name: SoundName | null, fadeDuration = 1500) {
    // אם כבר מנגן את אותו אמביינס — לא עושה כלום
    if (name === currentAmbienceName) return;

    // Fade out אמביינס נוכחי
    if (currentAmbience) {
      const oldAmbience = currentAmbience;
      oldAmbience.fade(oldAmbience.volume(), 0, fadeDuration);
      setTimeout(() => {
        oldAmbience.stop();
      }, fadeDuration);
    }

    currentAmbienceName = name;

    if (!name || isMuted) {
      currentAmbience = null;
      return;
    }

    // Fade in אמביינס חדש
    const newAmbience = getSound(name, true);
    newAmbience.volume(0);
    newAmbience.play();
    newAmbience.fade(0, masterVolume * 0.4, fadeDuration);
    currentAmbience = newAmbience;
  },

  /**
   * עצור את כל הסאונדים
   */
  stopAll() {
    soundCache.forEach((sound) => sound.stop());
    currentAmbience = null;
    currentAmbienceName = null;
  },

  /**
   * שנה Volume כללי
   */
  setVolume(volume: number) {
    masterVolume = Math.max(0, Math.min(1, volume));
    Howler.volume(masterVolume);
  },

  /**
   * השתק / בטל השתקה
   */
  toggleMute() {
    isMuted = !isMuted;
    Howler.mute(isMuted);
    return isMuted;
  },

  /**
   * האם מושתק
   */
  get muted() {
    return isMuted;
  },

  /**
   * ה-Volume הנוכחי
   */
  get volume() {
    return masterVolume;
  },

  /**
   * טען מראש סאונדים חשובים
   */
  preload() {
    // טוען את הסאונדים הכי חשובים מראש
    getSound('knifeStab');
    getSound('cardFlip');
    getSound('heartbeat', true);
    getSound('gavel');
  },
};

// === TTS — מנחה מקריין ===

let currentTtsAudio: HTMLAudioElement | null = null;

/**
 * הקראת טקסט בעברית דרך Google Translate TTS API
 */
export function narratorSpeak(text: string, rate = 1.0) {
  if (typeof window === 'undefined' || isMuted) return;

  // עצור הקראה קודמת
  narratorStop();

  const url = `/api/tts?text=${encodeURIComponent(text)}`;
  const audio = new Audio(url);
  audio.playbackRate = Math.max(0.5, Math.min(2, rate));
  audio.volume = Math.min(1, masterVolume * 1.2);

  currentTtsAudio = audio;
  audio.play().catch(() => {
    // שגיאה שקטה — לא תוצג למשתמש
  });
}

/**
 * ביטול הקראה
 */
export function narratorStop() {
  if (currentTtsAudio) {
    currentTtsAudio.pause();
    currentTtsAudio.src = '';
    currentTtsAudio = null;
  }
}
