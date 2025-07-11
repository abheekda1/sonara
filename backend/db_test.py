from db_client import (
    get_transcripts_for_caregiver,
    create_transcript,
    create_sentences
)

def main():
    # Use a real caregiver_id from your DB:
    CAREGIVER_ID = "4f8e7a1c-9d8b-4f14-8f1a-2c5b6d7e9a01"

    # 1) Create the transcript
    raw_text = (
        "She woke up at 6 AM. "
        "I gave her breakfast and morning meds. "
        "She seemed a bit anxious today."
    )
    print("Creating transcript…")
    transcript = create_transcript(
        caregiver_id=CAREGIVER_ID,
        raw_text=raw_text
    )
    print(" → Transcript created:", transcript)
    tx_id = transcript["id"]

    # 2) Prepare test sentences with sequence_id
    test_sentences = [
        {"sequence_id": 0, "text": "She woke up at 6 AM.",    "category": "activity"},
        {"sequence_id": 1, "text": "I gave her breakfast and morning meds.", "category": "activity"},
        {"sequence_id": 2, "text": "She seemed a bit anxious today.",        "category": "observation"}
    ]

    # 3) Bulk insert them
    print("\nInserting sentences…")

    inserted = create_sentences(transcript_id=tx_id, sentences=test_sentences)

    print(f" → Inserted {len(inserted)} sentences:")
    for s in inserted:
        print(f"   [{s['sequence_id']}] {s['text']} → {s['category']}")

    # 4) Verify by fetching transcripts
    print("\nFetching transcripts for caregiver…")

    all_txs = get_transcripts_for_caregiver(CAREGIVER_ID)
    
    print(f" → Found {len(all_txs)} transcript(s). Latest first:")
    for t in all_txs:
        print(f"   • {t['id']} (created_at={t['created_at']})")

if __name__ == "__main__":
    main()
