from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from classify import classify_sentences
from ws import handle_browser

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 🔒 Change to specific domains in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TranscriptInput(BaseModel):
    transcript: str

@app.post("/classify")
async def classify(input: TranscriptInput):
    return {"classified": classify_sentences(input.transcript)}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        await handle_browser(websocket)
    except WebSocketDisconnect:
        print("👋 Browser disconnected")
