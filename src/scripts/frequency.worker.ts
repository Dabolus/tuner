import { WorkerRequest, WorkerResponse } from './utils';

// Heavily inspired by cwilso's work:
// https://github.com/cwilso/PitchDetect/blob/master/js/pitchdetect.js

const minSamples = 0; // will be initialized when AudioContext is created.
const goodEnoughCorrelation = 0.9; // this is the "bar" for how close a correlation needs to be
const baseLog = Math.log(1.122018454301965);

const noteFromPitch = (frequency: number) => {
  return 12 * (Math.log(frequency / 440) / Math.log(2)) + 69;
};

const frequencyFromNoteNumber = (note: number) => {
  return 440 * Math.pow(2, (note - 69) / 12);
};

// FIXME: we are currently doing some extra useless work here
const centsOffFromPitch = (frequency: number, note: number) => {
  return Math.floor(
    (1200 * Math.log(frequency / frequencyFromNoteNumber(note))) / Math.log(2),
  );
};

const autoCorrelate = (buf: Float32Array, sampleRate: number) => {
  const size = buf.length;
  const maxSamples = Math.floor(size / 2);
  let bestOffset = -1;
  let bestCorrelation = 0;
  let rms = 0;
  let foundGoodCorrelation = false;
  const correlations = new Array(maxSamples);

  for (let i = 0; i < size; i++) {
    const val = buf[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / size);
  // not enough signal
  if (rms < 0.01) {
    return -1;
  }

  let lastCorrelation = 1;
  for (let offset = minSamples; offset < maxSamples; offset++) {
    let correlation = 0;

    for (let i = 0; i < maxSamples; i++) {
      correlation += Math.abs(buf[i] - buf[i + offset]);
    }
    correlation = 1 - correlation / maxSamples;
    correlations[offset] = correlation; // store it, for the tweaking we need to do below.
    if (correlation > goodEnoughCorrelation && correlation > lastCorrelation) {
      foundGoodCorrelation = true;
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestOffset = offset;
      }
    } else if (foundGoodCorrelation) {
      // short-circuit - we found a good correlation, then a bad one, so we'd just be seeing copies
      // from here. Now we need to tweak the offset - by interpolating between the values to the
      // left and right of the best offset, and shifting it a bit.  This is complex, and HACKY in
      // this code (happy to take PRs!) - we need to do a curve fit on correlations[] around
      // bestOffset in order to better determine precise (anti-aliased) offset.

      // we know bestOffset >=1,
      // since foundGoodCorrelation cannot go to true until the second pass (offset=1), and
      // we can't drop into this clause until the following pass (else if).
      const shift =
        (correlations[bestOffset + 1] - correlations[bestOffset - 1]) /
        correlations[bestOffset];
      return sampleRate / (bestOffset + 8 * shift);
    }
    lastCorrelation = correlation;
  }
  if (bestCorrelation > 0.01) {
    return sampleRate / bestOffset;
  }
  return -1;
};

/* Cents are from -100 to 100.
 * We need to do this calculations to convert them to
 * a degree between 50 and 130 in a logarithmic scale.
 *
 * This is what we are actually doing:
 * - If cents is 0, just leave it to 0 without any computation
 * - Compute the absolute value of the cents: -100 - 100 => 0 - 100
 * - Compute the logarithm in a precomputed base of the absolute value of the cents,
 *   so that we obtain a value from 0 to 40 in a logarithmic scale
 * - If the number was negative, make it negative again
 * - Finally, add the base degree (90°), so that we have a final degree between 50 and 130
 * */
const centsToAngle = (cents: number) => {
  if (!cents) {
    return 90;
  }
  const multiplier = cents < 0 ? -1 : 1;
  const logValue = (Math.log(cents * multiplier) / baseLog) * multiplier;
  return logValue + 90;
};

addEventListener('message', ({ data }: { data: WorkerRequest }) => {
  const frequency = autoCorrelate(data.buffer, data.sampleRate);
  if (frequency === -1) {
    postMessage(null);
    return;
  }
  const noteFrequency = noteFromPitch(frequency);
  const roundedNoteFrequency = Math.round(noteFrequency);
  const cents = centsOffFromPitch(frequency, roundedNoteFrequency);
  postMessage({
    cents,
    centsAngle: centsToAngle(cents),
    frequency: noteFrequency,
    index: roundedNoteFrequency % 12,
    noteFrequency: roundedNoteFrequency,
  } as WorkerResponse);
});

export default self as any;
