const { createClient, LiveTranscriptionEvents } = require("@deepgram/sdk");
const fetch = require("cross-fetch");
const dotenv = require("dotenv");
const { createServer } = require("http");
const { WebSocketServer } = require("ws");
dotenv.config();

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);
const server = createServer();
const wss = new WebSocketServer({ server });

wss.on("connection", (browser) => {
  console.log("🌐 Browser connected");

  /* 1️⃣  Create the Deepgram client — NO await */
  const dg = deepgram.listen.live({
    model: "nova-3",
    language: "en-US",
    encoding: "linear16", // MediaRecorder default
    sample_rate: 48000,
    interim_results: true,
    smart_format: true,
  });

  /* 2️⃣  Add ALL event handlers immediately */
  dg.on(LiveTranscriptionEvents.Error, (e) => console.error("DG error:", e));
  dg.on(LiveTranscriptionEvents.Close, () => console.log("🛑 DG closed"));
  dg.on(LiveTranscriptionEvents.Open, () => {
    console.log("✅ Deepgram connection open");

    /* Deepgram → browser */
    dg.on(LiveTranscriptionEvents.Transcript, (pkt) => {
      // console.log("packet:", pkt);
      console.log(pkt.channel);
      const alt = pkt.channel.alternatives[0];
      if (alt?.transcript) {
        browser.send(
          JSON.stringify({ final: pkt.is_final, text: alt.transcript }),
        );
      }
    });

    /* browser → Deepgram (start streaming only after Open) */
    browser.on("message", (audio) => {
      if (audio?.byteLength) {
        // should be ~17 kB every 250 ms
        // console.log("→ DG", audio.byteLength);
        dg.send(audio);
      }
      // console.log("got", audio.byteLength, "bytes from browser");
      // dg.send(audio);
    });
  });

  /* 3️⃣  House-keeping */
  browser.on("close", () => {
    console.log("👋 Browser disconnected");
    dg.requestClose(); // flush & close DG socket
  });
});

server.listen(8080, () => console.log("🚀 WS proxy on :8080"));
