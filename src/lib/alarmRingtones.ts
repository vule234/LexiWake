import { Audio } from 'expo-av';
import { Buffer } from 'buffer';

export type AlarmRingtoneKey = 'classic' | 'bright' | 'focus' | 'vibrate' | 'silent';

type ToneSegment = {
  frequency: number;
  durationMs: number;
  gain?: number;
  silenceAfterMs?: number;
};

const SAMPLE_RATE = 22050;
const WAV_CACHE = new Map<string, string>();

const RINGTONE_SEGMENTS: Record<Exclude<AlarmRingtoneKey, 'vibrate' | 'silent'>, ToneSegment[]> = {
  classic: [
    { frequency: 880, durationMs: 220, gain: 0.45, silenceAfterMs: 70 },
    { frequency: 660, durationMs: 220, gain: 0.4, silenceAfterMs: 110 },
    { frequency: 880, durationMs: 260, gain: 0.48, silenceAfterMs: 260 },
  ],
  bright: [
    { frequency: 1046, durationMs: 180, gain: 0.42, silenceAfterMs: 60 },
    { frequency: 1318, durationMs: 180, gain: 0.4, silenceAfterMs: 60 },
    { frequency: 1567, durationMs: 240, gain: 0.38, silenceAfterMs: 260 },
  ],
  focus: [
    { frequency: 523, durationMs: 320, gain: 0.42, silenceAfterMs: 80 },
    { frequency: 659, durationMs: 280, gain: 0.38, silenceAfterMs: 100 },
    { frequency: 784, durationMs: 280, gain: 0.35, silenceAfterMs: 260 },
  ],
};

const clamp16Bit = (value: number) => Math.max(-32768, Math.min(32767, Math.round(value)));

const writeString = (view: DataView, offset: number, value: string) => {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
};

const pcmToWavDataUri = (samples: Int16Array) => {
  const dataSize = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let index = 0; index < samples.length; index += 1) {
    view.setInt16(offset, samples[index], true);
    offset += 2;
  }

  const bytes = new Uint8Array(buffer);
  return `data:audio/wav;base64,${Buffer.from(bytes).toString('base64')}`;
};

const buildToneSamples = (segments: ToneSegment[]) => {
  const samples: number[] = [];

  segments.forEach((segment) => {
    const activeSamples = Math.floor((SAMPLE_RATE * segment.durationMs) / 1000);
    const silenceSamples = Math.floor((SAMPLE_RATE * (segment.silenceAfterMs || 0)) / 1000);
    const gain = segment.gain ?? 0.4;

    for (let index = 0; index < activeSamples; index += 1) {
      const progress = index / activeSamples;
      const envelope = progress < 0.08
        ? progress / 0.08
        : progress > 0.86
          ? (1 - progress) / 0.14
          : 1;
      const sample = Math.sin((2 * Math.PI * segment.frequency * index) / SAMPLE_RATE) * gain * envelope;
      samples.push(clamp16Bit(sample * 32767));
    }

    for (let index = 0; index < silenceSamples; index += 1) {
      samples.push(0);
    }
  });

  return new Int16Array(samples);
};

export const getAlarmRingtoneUri = (key: AlarmRingtoneKey) => {
  if (key === 'vibrate' || key === 'silent') {
    return null;
  }

  if (WAV_CACHE.has(key)) {
    return WAV_CACHE.get(key) || null;
  }

  const dataUri = pcmToWavDataUri(buildToneSamples(RINGTONE_SEGMENTS[key]));
  WAV_CACHE.set(key, dataUri);
  return dataUri;
};

export async function playAlarmRingtonePreview(key: AlarmRingtoneKey) {
  const uri = getAlarmRingtoneUri(key);
  if (!uri) {
    return null;
  }

  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
  });

  const { sound } = await Audio.Sound.createAsync(
    { uri },
    { shouldPlay: true, isLooping: false }
  );

  sound.setOnPlaybackStatusUpdate((status) => {
    if (status.isLoaded && status.didJustFinish) {
      void sound.unloadAsync();
    }
  });

  return sound;
}
