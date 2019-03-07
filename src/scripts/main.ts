import FrequencyWorker from './frequency.worker';
import { UI } from './ui';
import { WorkerRequest, WorkerResponse } from './utils';

window.addEventListener('load', async () => {
  const ui = new UI();
  try {
    await ui.ready;
    await ui.setLoadingMessage('waitingMic');
    // Wait for the user to give us access to their mic
    const micStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    await ui.setLoadingMessage('warmingUp');
    // TODO: move audio context computations in the Worker as soon as it becomes possible
    // See: https://github.com/WebAudio/web-audio-api/issues/1098
    const buffer = new Float32Array(1024);
    const ctx = new AudioContext();
    const micStreamSource = ctx.createMediaStreamSource(micStream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    micStreamSource.connect(analyser);

    const worker = new FrequencyWorker();
    worker.addEventListener('message', ({ data }: { data: WorkerResponse }) =>
      ui.updateFrequency(data),
    );

    const loop = () => {
      analyser.getFloatTimeDomainData(buffer);
      worker.postMessage({
        buffer,
        sampleRate: ctx.sampleRate,
      } as WorkerRequest);
      requestAnimationFrame(loop);
    };

    ui.onStart(async () => {
      await ctx.resume();
      loop();
      ui.hideLoading();
    });

    await ui.showLoading('start', 'start');
  } catch (e) {
    await ui.showLoading(false, 'initError', e.message);
  }
});
