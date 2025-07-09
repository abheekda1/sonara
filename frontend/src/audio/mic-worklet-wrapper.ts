export async function createAudioWorklet(
  callback: (buffer: ArrayBuffer) => void,
) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const context = new AudioContext({ sampleRate: 48000 });

  await context.audioWorklet.addModule("/mic-worklet-processor.js"); // must be compiled separately

  const source = context.createMediaStreamSource(stream);
  const node = new AudioWorkletNode(context, "mic-processor");

  node.port.onmessage = (e) => callback(e.data);
  node.port.postMessage({ sendAudio: true });

  source.connect(node);
  node.connect(context.destination);
}
