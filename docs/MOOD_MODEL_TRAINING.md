# Optional public-data model evaluation and fine-tuning

This workflow is separate from Django startup and is not required to use MindHaven. It evaluates or fine-tunes a seven-label emotion classifier using public data; it does **not** use MindHaven accounts, check-ins, or diary entries. Running it does not change the model used by the application.

## Data and label policy

The workflow uses the public [GoEmotions dataset](https://huggingface.co/datasets/google-research-datasets/go_emotions), simplified configuration, pinned to dataset revision `add492243ff905527e67aeb8b80c082af02207c3`. Its Hugging Face dataset metadata declares Apache-2.0; review the current dataset card, original paper, and license before each reuse. It contains Reddit comments labeled with 27 emotions plus neutral, including some examples that may be upsetting.

The script maps only clear label matches to the deployed classifier's seven labels. It discards unsupported or multiply-mapped examples instead of forcing an arbitrary emotion. It removes empty text and normalized exact duplicates across source splits, then creates new grouped train/validation/test splits. The dataset mapper retains only examples with exactly one unambiguous mapped label, so the benchmark does not measure every real-world mixed-emotion case. Review dataset provenance, licensing, content, mapping suitability, and label balance for your intended use before training.

## Evaluate a model before training

Run this in a private Google Colab runtime or another machine with enough memory. A GPU is recommended for the larger model and fine-tuning. A local CPU run can work with a reduced evaluation batch size but may take substantially longer. Install the optional workflow dependencies and a PyTorch build appropriate for the machine:

```python
%pip install -r backend/requirements-mood-training.txt
```

Evaluate the current default model on the pinned, grouped, held-out GoEmotions test split without training:

```python
!python backend/mood/training/finetune_go_emotions.py \
  --output-dir /content/mood-baseline \
  --evaluate-only \
  --eval-batch-size 2
```

Compare the larger RoBERTa checkpoint on the same split:

```python
!python backend/mood/training/finetune_go_emotions.py \
  --output-dir /content/mood-roberta-large \
  --base-model j-hartmann/emotion-english-roberta-large \
  --evaluate-only \
  --eval-batch-size 2
```

The larger checkpoint has much higher memory and compute requirements. Its model card specifies the same seven labels but does not publish a comparative accuracy result, so treat its evaluation as an experiment—not a guaranteed improvement. `evaluation.json` records the exact resolved model revision, dataset revision, overall accuracy, macro precision/recall/F1, per-class metrics, and confusion matrix. Compare the same metrics and split between models. Inspect the errors and class balance; do not infer clinical validity or user-specific accuracy from this dataset.

Do not tune repeatedly against the held-out test set. Use it as a final comparison after decisions are made using the training and validation splits.

## Fine-tune an experimental candidate

Run the same script without `--evaluate-only` to fine-tune the selected base model. The script evaluates the base and candidate on the same held-out public test split, selects checkpoints using validation macro-F1, saves a detailed `evaluation.json`, and exports candidate weights to `fine-tuned-model`. `--base-model-revision` can pin an immutable model revision; the resolved revision is recorded in the report. Adjust `--train-batch-size`, `--eval-batch-size`, and `--epochs` for the available hardware:

```python
!python backend/mood/training/finetune_go_emotions.py \
  --output-dir /content/mood-experiment \
  --epochs 3 \
  --train-batch-size 8 \
  --eval-batch-size 2
```

Review evaluation results and qualitative errors before considering deployment. A higher public benchmark score does not establish that the model is more accurate for MindHaven users.

Only after independent review, an approved model may be configured through Django's server-side `MOOD_AI_MODEL_ID`. Confirm its output labels exactly match the seven-label contract and its resource use is acceptable before deployment. Do not change production settings based only on the script's metrics. The script never uploads a model, accesses Hub credentials for publishing, or touches the application database.

Dataset and model downloads are explicit actions when the script is run. Treat exported weights as experimental until independently evaluated and reviewed.
