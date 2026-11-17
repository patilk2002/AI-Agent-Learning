
const RERANKER_URL = "http://127.0.0.1:8000";

export async function rerankDocuments(
    question,
    documents,
    topN = 3
) {
    const response = await fetch(
        `${RERANKER_URL}/rerank`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                query: question,
                documents,
                top_n: topN
            })
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(
            `Reranker service error: ${response.status} ${error}`
        );
    }

    const data = await response.json();

    return data.results;
}
