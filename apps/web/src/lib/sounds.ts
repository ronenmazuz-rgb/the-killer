'use client';

import { Howl, Howler } from 'howler';

// === הגדרת סאונדים ===
const SOUND_PATHS = {
  // אמביינס
  nightAmbience: '/sounds/ambience/night.mp3',
  dayAmbience: '/sounds/ambience/day.mp3',
  tension: '/sounds/ambience/tension.mp3',

  // אפקטים
  cardDeal: '/sounds/sfx/card-deal.mp3',
  cardFlip: '/sounds/sfx/card-flip.mp3',
  knifeStab: '/sounds/sfx/knife-stab.mp3',
  heartbeat: '/sounds/sfx/heartbeat.mp3',
  gavel: '/sounds/sfx/gavel.mp3',
  crowdGasp: '/sounds/sfx/crowd-gasp.mp3',
  victory: '/sounds/sfx/victory.mp3',
  defeat: '/sounds/sfx/defeat.mp3',
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

let ttsVoice: SpeechSynthesisVoice | null = null;

/**
 * אתחול קול עברי ל-TTS
 */
function initHebrewVoice() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  const voices = window.speechSynthesis.getVoices();
  // מחפש קול עברי
  ttsVoice =
    voices.find((v) => v.lang.startsWith('he')) ??
    voices.find((v) => v.lang.startsWith('iw')) ?? // fallback
    null;
}

// אתחול כשהקולות נטענים
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = initHebrewVoice;
  initHebrewVoice();
}

/**
 * הקראת טקסט בעברית (TTS)
 */
export function narratorSpeak(text: string, rate = 0.9) {
  if (typeof window === 'undefined' || !window.speechSynthesis || isMuted) return;

  // ביטול הקראה קודמת
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'he-IL';
  utterance.rate = rate;
  utterance.pitch = 0.8; // קול נמוך ודרמטי
  utterance.volume = masterVolume;

  if (ttsVoice) {
    utterance.voice = ttsVoice;
  }

  window.speechSynthesis.speak(utterance);
}

/**
 * ביטול הקראה
 */
export function narratorStop() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}
