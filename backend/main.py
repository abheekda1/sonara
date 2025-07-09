import os
import asyncio
import json
from websockets.asyncio.server import serve
from dotenv import load_dotenv
from deepgram import DeepgramClient, LiveOptions, LiveTranscriptionEvents

load_dotenv()
DG_API_KEY = os.getenv("DEEPGRAM_API_KEY")
if not DG_API_KEY:
    raise ValueError("DEEPGRAM_API_KEY not set")

dg = DeepgramClient(DG_API_KEY)

async def handle_browser(ws):
    print("🌐 Browser connected")

    dg_ws = dg.listen.websocket.v("1")
    loop = asyncio.get_running_loop()

    # All handlers must be async
    async def on_error(self, error):
        print("DG error:", error)

    async def on_close(self, close):
        print("🛑 DG closed")

    async def on_open(self, open):
        print("✅ Deepgram connection open")

    async def on_transcript(self, result):
        alt = result.channel.alternatives[0]
        if alt.transcript:
            await ws.send(json.dumps({
                "final": result.is_final,
                "text": alt.transcript
            }))

    dg_ws.on(LiveTranscriptionEvents.Error, lambda *args, **kwargs: asyncio.run_coroutine_threadsafe(on_error(*args, **kwargs), loop))
    dg_ws.on(LiveTranscriptionEvents.Close, lambda *args, **kwargs: asyncio.run_coroutine_threadsafe(on_close(*args, **kwargs), loop))
    dg_ws.on(LiveTranscriptionEvents.Open, lambda *args, **kwargs: asyncio.run_coroutine_threadsafe(on_open(*args, **kwargs), loop))
    dg_ws.on(LiveTranscriptionEvents.Transcript, lambda *args, **kwargs: asyncio.run_coroutine_threadsafe(on_transcript(*args, **kwargs), loop))

    dg_ws.start(LiveOptions(
        model="nova-3",
        language="en-US",
        encoding="linear16",
        sample_rate=48000,
        interim_results=True,
        smart_format=True,
    ))

    try:
        async for message in ws:
            if isinstance(message, bytes):
                dg_ws.send(message)
    except Exception:
        pass
    finally:
        print("👋 Browser disconnected")
        dg_ws.finish()

async def send_transcript(pkt, ws):
    alt = pkt.channel.alternatives[0]
    if alt.transcript:
        await ws.send(json.dumps({
            "final": pkt.is_final,
            "text": alt.transcript
        }))

async def main():
    async with serve(handle_browser, "0.0.0.0", 8080):
        print("🚀 WS proxy on :8080")
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())
