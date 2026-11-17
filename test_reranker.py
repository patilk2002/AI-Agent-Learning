
from fastembed.rerank.cross_encoder import TextCrossEncoder

# 1. Load the cross-encoder model
print("Loading reranker model...")

reranker = TextCrossEncoder(
    model_name="Xenova/ms-marco-MiniLM-L-6-v2"
)

print("Model loaded successfully!")

# 2. Define the user's question
query = "Who must approve international transfers above €100,000?"

# 3. Sample retrieved documents
documents = [
    "All international wire transfers require verification.",

    "Transfers above €50,000 require additional approval from the compliance department.",

    "Transfers above €100,000 additionally require approval from the regional compliance head.",

    "All transactions must be recorded for auditing.",

    "Domestic transfers are processed according to standard procedures."
]

# 4. Calculate relevance scores
scores = list(reranker.rerank(query, documents))

# 5. Sort documents by relevance
ranked_results = sorted(
    enumerate(scores),
    key=lambda item: item[1],
    reverse=True
)

# 6. Display results
print("\nReranked documents:\n")

for rank, (index, score) in enumerate(ranked_results, start=1):
    print(f"Rank: {rank}")
    print(f"Score: {score:.4f}")
    print(f"Document: {documents[index]}")
    print("-" * 60)
