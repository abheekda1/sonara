from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from classify import classify_sentences
from ws import handle_browser

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # 🔒 Change to specific domains in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TranscriptInput(BaseModel):
    transcript: str

@app.post("/classify")
async def classify(input: TranscriptInput):
    return {"classified": classify_sentences(input.transcript)}

@app.post("/db/transcript")
async def create_transcript(transcript: str):
    return {"message": "Transcript created"}

@app.put("/db/transcript")
async def update_transcript(transcript_id: int, transcript: str):
    return {"message": "Transcript updated"}

@app.delete("/db/transcript")
async def delete_transcript(transcript_id: int):
    return {"message": "Transcript deleted"}

@app.get("/db/transcript")
async def get_transcript(transcript_id: int):
    return {"message": "Transcript retrieved"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        await handle_browser(websocket)
    except WebSocketDisconnect:
        print("👋 Browser disconnected")
