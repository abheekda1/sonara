import os
from dotenv import load_dotenv
from supabase import create_client
from postgrest import APIError

load_dotenv()
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]
supabase     = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_transcripts_for_caregiver(caregiver_id: str):
    resp = (
        supabase
        .table("transcripts")
        .select("*")
        .eq("caregiver_id", caregiver_id)
        .order("created_at", desc=True)
        .execute()
    )
    return resp.data

def create_transcript(caregiver_id: str, raw_text: str):
    payload = {
        "caregiver_id": caregiver_id,
        "raw_text":     raw_text,
    }
    try:
        resp = (
            supabase
            .table("transcripts")
            .insert(payload)
            .execute()
        )
    except APIError as e:
        raise RuntimeError(f"Insert failed: {e}") from e
    return resp.data[0]

def create_sentences(transcript_id: str, sentences: list[dict]):
    """
    Expects each dict in `sentences` to have:
      - "sequence_id": int
      - "text":         str
      - "category":     str  # matches your enum exactly
    """
    # attach the transcript foreign-key
    for s in sentences:
        s["transcript_id"] = transcript_id

    try:
        resp = (
            supabase
            .table("sentences")
            .insert(sentences)
            .execute()
        )
    except APIError as e:
        raise RuntimeError(f"Insert sentences failed: {e}") from e

    return resp.data
