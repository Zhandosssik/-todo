let audioContext = null;
let masterGain = null;
let alarmNodes = [];
let alarmInterval = null;
let vibrationInterval = null;
let escalationInterval = null;
let startTime = 0;
let vibrationAllowed = false;
let vibrationActive = false;

export function unlockAlarmFeedback() {
  vibrationAllowed = true;
}

function safeVibrate(pattern) {
  if (!vibrationAllowed || !navigator.vibrate) return false;
  try {
    navigator.vibrate(pattern);
    return true;
  } catch {
    return false;
  }
}

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
}

function playPulse(ctx, time, freq, volume) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(freq, time);
  osc.connect(gain);
  gain.connect(masterGain);
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(volume, time + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
  osc.start(time);
  osc.stop(time + 0.4);
  alarmNodes.push(osc);
}

function getVolume(elapsedSec) {
  return Math.min(0.15 + elapsedSec * 0.005, 0.55);
}

function getInterval(elapsedSec) {
  return Math.max(280 - elapsedSec * 3, 180);
}

function tickAlarm() {
  const ctx = getAudioContext();
  const elapsed = (Date.now() - startTime) / 1000;
  const now = ctx.currentTime;
  const vol = getVolume(elapsed);

  playPulse(ctx, now, 880, vol);
  playPulse(ctx, now + 0.15, 660, vol * 0.9);
  playPulse(ctx, now + 0.3, 990, vol);
}

function startVibration() {
  if (!navigator.vibrate) return;
  const pattern = [400, 150, 400, 150, 600];
  if (safeVibrate(pattern)) {
    vibrationActive = true;
    vibrationInterval = setInterval(() => safeVibrate(pattern), 2000);
  }
}

function stopVibration() {
  if (vibrationInterval) {
    clearInterval(vibrationInterval);
    vibrationInterval = null;
  }
  if (vibrationActive) {
    safeVibrate(0);
    vibrationActive = false;
  }
}

export function startAlarmSound() {
  stopAlarmSound();
  startTime = Date.now();

  const ctx = getAudioContext();
  masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(1, ctx.currentTime);
  masterGain.connect(ctx.destination);

  tickAlarm();
  alarmInterval = setInterval(tickAlarm, getInterval(0));

  escalationInterval = setInterval(() => {
    if (alarmInterval) {
      clearInterval(alarmInterval);
      const elapsed = (Date.now() - startTime) / 1000;
      alarmInterval = setInterval(tickAlarm, getInterval(elapsed));
    }
  }, 15000);

  startVibration();
}

export function stopAlarmSound() {
  if (alarmInterval) {
    clearInterval(alarmInterval);
    alarmInterval = null;
  }
  if (escalationInterval) {
    clearInterval(escalationInterval);
    escalationInterval = null;
  }

  for (const node of alarmNodes) {
    try {
      node.stop();
    } catch {
      /* already stopped */
    }
  }
  alarmNodes = [];

  if (masterGain) {
    try {
      masterGain.disconnect();
    } catch {
      /* ignore */
    }
    masterGain = null;
  }

  stopVibration();
}

export function isAlarmSoundPlaying() {
  return alarmInterval !== null;
}

let wakeLock = null;

export async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => {
        wakeLock = null;
      });
    }
  } catch {
    /* wake lock not available */
  }
}

export function releaseWakeLock() {
  if (wakeLock) {
    wakeLock.release();
    wakeLock = null;
  }
}

let alarmCheckInterval = null;

export function startAlarmChecker(onTrigger) {
  stopAlarmChecker();

  alarmCheckInterval = setInterval(() => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const lastTrigger = localStorage.getItem('lastAlarmTrigger');
    const today = now.toISOString().split('T')[0];

    if (lastTrigger === `${today}-${timeStr}`) return;

    const config = JSON.parse(localStorage.getItem('alarmConfigCache') || '{}');
    if (config.enabled && config.time === timeStr) {
      localStorage.setItem('lastAlarmTrigger', `${today}-${timeStr}`);
      onTrigger();
    }
  }, 10000);
}

export function stopAlarmChecker() {
  if (alarmCheckInterval) {
    clearInterval(alarmCheckInterval);
    alarmCheckInterval = null;
  }
}

export function cacheAlarmConfig(config) {
  localStorage.setItem('alarmConfigCache', JSON.stringify(config));
}
