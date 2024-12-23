export async function embed(text: string): Promise<{ embedding: number[] }> {
	const res = await fetch('http://localhost:11434/api/embeddings', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			prompt: text,
			model: 'mxbai-embed-large',
			embedding: true
		})
	})

	const data = await res.json()

	return { embedding: data.embedding || [] }
}
