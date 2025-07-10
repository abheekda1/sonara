import asyncio
import os
import json
from dotenv import load_dotenv
from fastapi import WebSocket
from deepgram import DeepgramClient, LiveOptions, LiveTranscriptionEvents

load_dotenv()
DG_API_KEY = os.getenv("DEEPGRAM_API_KEY")
if not DG_API_KEY:
    raise ValueError("DEEPGRAM_API_KEY not set")

dg = DeepgramClient(DG_API_KEY)

async def handle_browser(ws: WebSocket):
    print("🌐 Browser connected")

    dg_ws = dg.listen.live.v("1")
    loop = asyncio.get_running_loop()  # 🔥 capture the main event loop here

    async def on_transcript(self, result):
        alt = result.channel.alternatives[0]
        if alt.transcript:
            await ws.send_text(json.dumps({
                "final": result.is_final,
                "text": alt.transcript
            }))

    async def on_open(self, open):
        print("✅ Deepgram connection open")

    async def on_close(self, close):
        print("🛑 Deepgram closed")

    async def on_error(self, error):
        print("❌ Deepgram error:", error)

    # Use thread-safe coroutine scheduling
    dg_ws.on(LiveTranscriptionEvents.Open, lambda *a, **k: asyncio.run_coroutine_threadsafe(on_open(*a, **k), loop))
    dg_ws.on(LiveTranscriptionEvents.Close, lambda *a, **k: asyncio.run_coroutine_threadsafe(on_close(*a, **k), loop))
    dg_ws.on(LiveTranscriptionEvents.Error, lambda *a, **k: asyncio.run_coroutine_threadsafe(on_error(*a, **k), loop))
    dg_ws.on(LiveTranscriptionEvents.Transcript, lambda *a, **k: asyncio.run_coroutine_threadsafe(on_transcript(*a, **k), loop))

    dg_ws.start(LiveOptions(
        model="nova-3",
        language="en-US",
        encoding="linear16",
        sample_rate=48000,
        interim_results=True,
        smart_format=True,
    ))

    try:
        while True:
            message = await ws.receive_bytes()
            dg_ws.send(message)
    except Exception as e:
        print("⚠️ Error during browser handling:", e)
    finally:
        print("👋 Browser disconnected")
        dg_ws.finish()
