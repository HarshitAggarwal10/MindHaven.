"""Optional cloud-only experiment; never used by the Django application."""

import argparse
import json
import re
from pathlib import Path

import numpy as np
import torch
from datasets import Dataset, load_dataset
from huggingface_hub import HfApi
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import GroupShuffleSplit
from torch.nn import CrossEntropyLoss
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    DataCollatorWithPadding,
    Trainer,
    TrainingArguments,
)


BASE_MODEL = "j-hartmann/emotion-english-distilroberta-base"
DATASET_ID = "google-research-datasets/go_emotions"
DATASET_REVISION = "add492243ff905527e67aeb8b80c082af02207c3"
LABELS = ("anger", "disgust", "fear", "joy", "neutral", "sadness", "surprise")
LABEL_MAPPING = {
    "anger": "anger",
    "disgust": "disgust",
    "fear": "fear",
    "nervousness": "fear",
    "joy": "joy",
    "amusement": "joy",
    "approval": "joy",
    "excitement": "joy",
    "gratitude": "joy",
    "love": "joy",
    "optimism": "joy",
    "pride": "joy",
    "relief": "joy",
    "neutral": "neutral",
    "sadness": "sadness",
    "disappointment": "sadness",
    "grief": "sadness",
    "remorse": "sadness",
    "surprise": "surprise",
}
ID_TO_LABEL = dict(enumerate(LABELS))
LABEL_TO_ID = {label: index for index, label in ID_TO_LABEL.items()}


def normalize_text(text):
    return re.sub(r"\s+", " ", text.casefold()).strip()


def collect_examples():
    dataset_info = HfApi().dataset_info(
        DATASET_ID,
        revision=DATASET_REVISION,
        token=False,
    )
    declared_license = getattr(dataset_info.card_data, "license", None)
    licenses = (
        declared_license
        if isinstance(declared_license, list)
        else [declared_license]
    )
    if "apache-2.0" not in licenses:
        raise RuntimeError(
            "The pinned dataset revision does not declare Apache-2.0. "
            "Review its provenance and license before using it."
        )
    dataset = load_dataset(
        DATASET_ID,
        "simplified",
        revision=DATASET_REVISION,
        token=False,
    )
    label_names = dataset["train"].features["labels"].feature.names
    seen_text = set()
    examples = []

    for split_name in ("train", "validation", "test"):
        for row in dataset[split_name]:
            text = row["text"].strip()
            normalized = normalize_text(text)
            if not text or not normalized or normalized in seen_text:
                continue
            seen_text.add(normalized)

            mapped_labels = {
                LABEL_MAPPING[label_names[label_id]]
                for label_id in row["labels"]
                if label_names[label_id] in LABEL_MAPPING
            }
            if len(mapped_labels) != 1:
                continue
            examples.append(
                {
                    "text": text,
                    "label": LABEL_TO_ID[mapped_labels.pop()],
                    "group": normalized,
                }
            )

    if not examples:
        raise RuntimeError("No examples remain after cleaning and label mapping.")
    return examples


def split_examples(examples):
    indices = np.arange(len(examples))
    labels = np.asarray([item["label"] for item in examples])
    groups = np.asarray([item["group"] for item in examples])

    first_split = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
    train_indices, held_out_indices = next(
        first_split.split(indices, labels, groups)
    )
    second_split = GroupShuffleSplit(n_splits=1, test_size=0.5, random_state=43)
    validation_relative, test_relative = next(
        second_split.split(
            held_out_indices,
            labels[held_out_indices],
            groups[held_out_indices],
        )
    )
    validation_indices = held_out_indices[validation_relative]
    test_indices = held_out_indices[test_relative]

    splits = {
        "train": [examples[index] for index in train_indices],
        "validation": [examples[index] for index in validation_indices],
        "test": [examples[index] for index in test_indices],
    }
    expected = set(range(len(LABELS)))
    for split_name, rows in splits.items():
        found = {row["label"] for row in rows}
        if found != expected:
            missing = [ID_TO_LABEL[index] for index in sorted(expected - found)]
            raise RuntimeError(
                f"The {split_name} split is missing labels {missing}; "
                "review the dataset mapping or split before training."
            )
    return splits


def tokenize_splits(splits, tokenizer, max_length=512):
    tokenized = {}
    for split_name, rows in splits.items():
        dataset = Dataset.from_list(
            [{"text": row["text"], "labels": row["label"]} for row in rows]
        )
        encoded = dataset.map(
            lambda batch: tokenizer(
                batch["text"],
                truncation=True,
                max_length=max_length,
            ),
            batched=True,
            remove_columns=["text"],
        )
        tokenized[split_name] = encoded
    return tokenized


def metrics_for(prediction):
    logits, labels = prediction
    predictions = np.argmax(logits, axis=-1)
    return {
        "accuracy": accuracy_score(labels, predictions),
        "macro_f1": f1_score(
            labels,
            predictions,
            labels=list(range(len(LABELS))),
            average="macro",
            zero_division=0,
        ),
        "macro_precision": precision_score(
            labels,
            predictions,
            labels=list(range(len(LABELS))),
            average="macro",
            zero_division=0,
        ),
        "macro_recall": recall_score(
            labels,
            predictions,
            labels=list(range(len(LABELS))),
            average="macro",
            zero_division=0,
        ),
    }


class WeightedTrainer(Trainer):
    def __init__(self, *args, class_weights, **kwargs):
        super().__init__(*args, **kwargs)
        self.class_weights = class_weights

    def compute_loss(self, model, inputs, return_outputs=False, num_items_in_batch=None):
        labels = inputs["labels"]
        outputs = model(**inputs)
        weights = self.class_weights.to(outputs.logits.device)
        loss = CrossEntropyLoss(weight=weights)(outputs.logits, labels)
        return (loss, outputs) if return_outputs else loss


def evaluate_and_report(trainer, dataset):
    prediction = trainer.predict(dataset)
    predicted_labels = np.argmax(prediction.predictions, axis=-1)
    report = classification_report(
        prediction.label_ids,
        predicted_labels,
        labels=list(range(len(LABELS))),
        target_names=list(LABELS),
        output_dict=True,
        zero_division=0,
    )
    return {
        **metrics_for((prediction.predictions, prediction.label_ids)),
        "per_class": report,
        "confusion_matrix": confusion_matrix(
            prediction.label_ids,
            predicted_labels,
            labels=list(range(len(LABELS))),
        ).tolist(),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--base-model", default=BASE_MODEL)
    parser.add_argument(
        "--base-model-revision",
        help="Optional immutable model revision; the resolved revision is recorded in the report.",
    )
    parser.add_argument("--epochs", type=float, default=3)
    parser.add_argument("--train-batch-size", type=int, default=8)
    parser.add_argument("--eval-batch-size", type=int, default=16)
    parser.add_argument(
        "--evaluate-only",
        action="store_true",
        help="Evaluate the selected model on the held-out public test split without training.",
    )
    args = parser.parse_args()
    if args.epochs <= 0:
        parser.error("--epochs must be greater than zero.")
    if args.train_batch_size <= 0 or args.eval_batch_size <= 0:
        parser.error("Batch sizes must be greater than zero.")
    args.output_dir.mkdir(parents=True, exist_ok=True)

    examples = collect_examples()
    splits = split_examples(examples)
    print(
        json.dumps(
            {
                "dataset": DATASET_ID,
                "dataset_revision": DATASET_REVISION,
                "license": "Apache-2.0 (verified against pinned dataset metadata)",
                "retained_examples": len(examples),
                "split_sizes": {key: len(value) for key, value in splits.items()},
                "label_counts": {
                    split: {
                        ID_TO_LABEL[label]: sum(row["label"] == label for row in rows)
                        for label in range(len(LABELS))
                    }
                    for split, rows in splits.items()
                },
            },
            indent=2,
        )
    )

    model_load_options = (
        {"revision": args.base_model_revision, "token": False}
        if args.base_model_revision
        else {"token": False}
    )
    tokenizer = AutoTokenizer.from_pretrained(
        args.base_model,
        **model_load_options,
    )
    tokenized = tokenize_splits(splits, tokenizer)
    model = AutoModelForSequenceClassification.from_pretrained(
        args.base_model,
        **model_load_options,
        num_labels=len(LABELS),
        id2label=ID_TO_LABEL,
        label2id=LABEL_TO_ID,
    )

    output_dir = args.output_dir.resolve()
    training_args = TrainingArguments(
        output_dir=str(output_dir / "checkpoints"),
        seed=42,
        data_seed=42,
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.train_batch_size,
        per_device_eval_batch_size=args.eval_batch_size,
        eval_strategy="epoch" if not args.evaluate_only else "no",
        save_strategy="epoch" if not args.evaluate_only else "no",
        save_total_limit=2,
        load_best_model_at_end=not args.evaluate_only,
        metric_for_best_model="eval_macro_f1",
        greater_is_better=True,
        weight_decay=0.01,
        report_to="none",
        fp16=torch.cuda.is_available(),
    )
    trainer_options = {
        "model": model,
        "args": training_args,
        "processing_class": tokenizer,
        "data_collator": DataCollatorWithPadding(tokenizer=tokenizer),
        "compute_metrics": metrics_for,
    }
    if args.evaluate_only:
        trainer = Trainer(**trainer_options)
    else:
        training_labels = np.asarray([row["label"] for row in splits["train"]])
        counts = np.bincount(training_labels, minlength=len(LABELS))
        present_classes = max(1, int(np.count_nonzero(counts)))
        weights = len(training_labels) / (present_classes * np.maximum(counts, 1))
        class_weights = torch.tensor(weights, dtype=torch.float32)
        trainer = WeightedTrainer(
            **trainer_options,
            train_dataset=tokenized["train"],
            eval_dataset=tokenized["validation"],
            class_weights=class_weights,
        )

    baseline = evaluate_and_report(trainer, tokenized["test"])
    fine_tuned = None
    exported = None
    if not args.evaluate_only:
        trainer.train()
        fine_tuned = evaluate_and_report(
            trainer,
            tokenized["test"],
        )
        exported = output_dir / "fine-tuned-model"
        trainer.save_model(str(exported))
        tokenizer.save_pretrained(str(exported))
    evaluation = {
        "dataset": DATASET_ID,
        "dataset_revision": DATASET_REVISION,
        "retained_examples": len(examples),
        "split_sizes": {key: len(value) for key, value in splits.items()},
        "base_model": args.base_model,
        "base_model_revision": getattr(model.config, "_commit_hash", None),
        "labels": list(LABELS),
        "evaluation_only": args.evaluate_only,
        "baseline_test": baseline,
        "fine_tuned_test": fine_tuned,
        "macro_f1_difference": (
            fine_tuned["macro_f1"] - baseline["macro_f1"]
            if fine_tuned is not None
            else None
        ),
        "note": "Offline dataset results do not establish clinical validity or user-specific accuracy.",
        "exported_model_directory": str(exported) if exported else None,
    }
    (output_dir / "evaluation.json").write_text(
        json.dumps(evaluation, indent=2),
        encoding="utf-8",
    )
    print(f"Evaluation report saved under {output_dir}")


if __name__ == "__main__":
    main()
