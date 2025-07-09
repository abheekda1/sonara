#!/usr/bin/env python3
# classify_sum.py

"""
Zero-shot classification script that:
 1. Classifies a given text into observation vs. activity labels
 2. Prints each label’s score
 3. Sums scores by “observation” and “activity” prefixes and prints the totals

Usage:
    pip install transformers torch
    python classify_sum.py
"""




# add third classification label with each sentence describing priority of observation/activity


from transformers import pipeline

def main():
    # 1. Initialize the zero-shot classification pipeline
    classifier = pipeline(
        "zero-shot-classification",
        model="facebook/bart-large-mnli"
    )

    # 2. Define your input text and the candidate labels
    text = "Looked in the mirror and saw chopped."

    candidate_labels = [
        # Observation labels
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
        # Activity labels
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
        "activity patient does procedures & visits (doctor, school activity, fire drill)"
    ]

    # 3. Run the classifier
    result = classifier(
        sequences=text,
        candidate_labels=candidate_labels,
        multi_label=False
    )

    # 5. Sum scores by prefix
    sum_observation = sum(
        score for label, score in zip(result["labels"], result["scores"])
        if label.startswith("observation")
    )
    sum_activity = sum(
        score for label, score in zip(result["labels"], result["scores"])
        if label.startswith("activity")
    )

    # 6. Print summed scores
    print(f"Original Text:\n{text}")
    print("\nSummed scores:")
    # 5. After summing scores, print the higher percentage first
    if sum_observation >= sum_activity:
        print(f"observation → {sum_observation:.2%}")
        print(f"activity    → {sum_activity:.2%}")
    else:
        print(f"activity    → {sum_activity:.2%}")
        print(f"observation → {sum_observation:.2%}")


if __name__ == "__main__":
    main()
