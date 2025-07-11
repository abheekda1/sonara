# realtime_vosk.py

import sounddevice as sd
import queue
import sys
import json
from vosk import Model, KaldiRecognizer

q = queue.Queue()

# Callback to fill audio buffer
def callback(indata, frames, time, status):
    if status:
        print(status, file=sys.stderr)
    q.put(bytes(indata))

# Load the model
model = Model("vosk-model-en-us-0.22")  # Adjust path if needed
samplerate = 16000  # Standard for Vosk

# Set up recognizer
rec = KaldiRecognizer(model, samplerate)

# Stream from mic
with sd.RawInputStream(samplerate=samplerate, blocksize=8000, device=None,
                       dtype='int16', channels=1, callback=callback):
    print("🎙️ Speak into your microphone...")
    while True:
        data = q.get()
        if rec.AcceptWaveform(data):
            result = json.loads(rec.Result())
            print("✅", result.get("text", ""))
        else:
            partial = json.loads(rec.PartialResult())
            print("🟡", partial.get("partial", ""))
