from datasets import load_dataset

dataset = load_dataset("KisanVaani/agriculture-qa-english-only", split="train")
print(f"Dataset features: {dataset.features}")
print(f"First item keys: {dataset[0].keys()}")
print(f"First item content: {dataset[0]}")
