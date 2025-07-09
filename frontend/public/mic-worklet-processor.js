// Exactly 960 samples = 20 ms @ 48 kHz
const FRAME = 960;

class MicProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buf = new Float32Array(FRAME);
    this.off = 0;
  }

  process(inputs) {
    const input = inputs[0][0];
    if (!input) return true;

    let p = 0;
    while (p < input.length) {
      const copy = Math.min(FRAME - this.off, input.length - p);
      this.buf.set(input.subarray(p, p + copy), this.off);
      p += copy;
      this.off += copy;

      if (this.off === FRAME) {
        /* ⇢ Int16 PCM */
        const pcm = new Int16Array(FRAME);
        for (let i = 0; i < FRAME; i++) {
          const s = Math.max(-1, Math.min(1, this.buf[i]));
          pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        this.port.postMessage(pcm.buffer, [pcm.buffer]);
        this.off = 0;
      }
    }
    return true;
  }
}
registerProcessor("mic-processor", MicProcessor);
