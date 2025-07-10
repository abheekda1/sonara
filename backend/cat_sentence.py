#!/usr/bin/env python3
# classify_sentences.py

"""
Zero-shot classification by sentence.

Usage:
    pip install transformers torch nltk
    python classify_sentences.py
"""

import nltk
nltk.download('punkt_tab')
from nltk.tokenize import sent_tokenize



# add third classification label with each sentence describing priority of observation/activity


from transformers import pipeline

# Candidate labels from your specification
CANDIDATE_LABELS = [
    # Observations
    "observation of patient appetite status",
    "observation of patient mood and cooperation",
    "observation of patient sleep quality",
    "observation of patient self-soothing ability",
    "observation of patient respiratory status",
    "observation of patient gastrointestinal status",
    "observation of patient menstrual status",
    "observation of patient device site condition",
    "observation of patient tremor or movement",
    "observation of patient leisure and enjoyment",
    # Activities
    "activity patient does eating and drinking",
    "activity patient does medication administration",
    "activity patient does enteral feeding (g-tube bolus)",
    "activity patient does hydration only",
    "activity patient does toileting & bowel movement",
    "activity patient does diaper change",
    "activity patient does personal hygiene (bath/shower)",
    "activity patient does therapy physical (ROM, stander, PT)",
    "activity patient does therapy occupational/speech (OT, ST, music, reading)",
    "activity patient does respiratory treatment (neb, albuterol)",
    "activity patient does chest physiotherapy (CPT)",
    "activity patient does medical device care (g-tube site, sensicare, pad change)",
    "activity patient does vital signs & observations",
    "activity patient does rest & leisure (TV, books, napping)",
    "activity patient does procedures & visits (doctor, school activity, fire drill)",
]

def classify_sentences(text: str):
    classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
    sentences = sent_tokenize(text)

    results = []
    for sentence in sentences:
        result = classifier(sentence, CANDIDATE_LABELS, multi_label=False)
        label_scores = list(zip(result["labels"], result["scores"]))

        sum_observation = sum(score for label, score in label_scores if label.startswith("observation"))
        sum_activity = sum(score for label, score in label_scores if label.startswith("activity"))

        predicted_type = "observation" if sum_observation >= sum_activity else "activity"

        results.append({
            "sentence": sentence,
            "type": predicted_type,
            "score_observation": sum_observation,
            "score_activity": sum_activity
        })

    return results

def main():
    transcript = """
    Looked in the mirror and saw chopped. Took medication this morning. Slept poorly last night.
    Patient laughed during therapy and then watched TV.
    """

    tagged = classify_sentences(transcript)

    print("\nClassified Sentences:")
    for entry in tagged:
        print(f"- {entry['type'].upper():<11} ({entry['score_observation']:.2%} obs / {entry['score_activity']:.2%} act): {entry['sentence']}")

if __name__ == "__main__":
    main()
