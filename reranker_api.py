
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastembed.rerank.cross_encoder import TextCrossEncoder

app = FastAPI(title="Local Reranking Service")

print("Loading reranker model...")

reranker = TextCrossEncoder(
    model_name="Xenova/ms-marco-MiniLM-L-6-v2"
)

print("Reranker ready!")

class RerankRequest(BaseModel):
    query: str
    documents: list[str]
    top_n: int = 3

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/rerank")
def rerank(request: RerankRequest):

    if not request.query.strip():
        raise HTTPException(400, "Query cannot be empty")

    if not request.documents:
        raise HTTPException(400, "Documents cannot be empty")

    if len(request.documents) > 50:
        raise HTTPException(400, "Maximum 50 documents allowed")

    if not 1 <= request.top_n <= len(request.documents):
        raise HTTPException(400, "Invalid top_n value")

    scores = list(
        reranker.rerank(
            request.query,
            request.documents
        )
    )

    results = [
        {
            "index": index,
            "score": float(score),
            "document": request.documents[index]
        }
        for index, score in enumerate(scores)
    ]

    results.sort(
        key=lambda item: item["score"],
        reverse=True
    )

    return {
        "results": results[:request.top_n]
    }
