
export async function fetchWithRetry(
    url,
    options = {},
    config = {}
) {
    const {
        maxRetries = 2,
        timeoutMs = 10000,
        initialDelayMs = 500
    } = config;

    const retryableStatuses = [
        408, 429, 500, 502, 503, 504
    ];

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url, {
                ...options,
                signal: AbortSignal.timeout(timeoutMs)
            });

            if (
                !retryableStatuses.includes(response.status)
                || attempt === maxRetries
            ) {
                return response;
            }

            console.warn(
                `HTTP ${response.status}. Retrying...`
            );

        } catch (error) {
            if (attempt === maxRetries) {
                throw error;
            }

            console.warn(
                `Request failed: ${error.message}. Retrying...`
            );
        }

        const exponentialDelay =
            initialDelayMs * Math.pow(2, attempt);

        const jitter = Math.random() * 200;

        await new Promise(resolve =>
            setTimeout(resolve, exponentialDelay + jitter)
        );
    }
}
