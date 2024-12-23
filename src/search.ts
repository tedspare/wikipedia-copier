import { parseArgs } from 'node:util'
import { searchDB } from '~/db'

export async function search(query: string) {
	try {
		const results = await searchDB(query)

		const synthesized = results.map(r => `${r.title}:\n${r.paragraph}`).join('\n\n\n')

		const stream = await fetch('http://localhost:11434/api/generate', {
			method: 'POST',
			body: JSON.stringify({
				model: 'qwen2.5:3b',
				prompt: `Given the following search results, please answer the user's question:
        
        Question: ${query}
        
        Snippets:
        ${synthesized}
        
        Ignore any information that is not relevant to the question.
        `.replace(/\t/g, ' ')
			})
		})

		if (!stream.ok) {
			throw new Error(`Error summarizing: ${stream.statusText}`)
		}

		let summary = ''

		const reader = stream.body?.getReader()
		if (!reader) {
			throw new Error('No reader')
		}

		while (true) {
			const { done, value } = await reader.read()
			if (done) break

			const text = new TextDecoder().decode(value)
			const lines = text.split('\n').filter(Boolean)
			for (const line of lines) {
				const data = JSON.parse(line)
				summary += data.response
				console.log(summary)
			}
		}

		return summary
	} catch (error) {
		console.error('Error summarizing:', error)
		return ''
	}
}

if (require.main === module) {
	const args = parseArgs({
		args: process.argv.slice(2),
		allowPositionals: true
	})

	const { positionals } = args

	const query = positionals.join(' ')

	const summary = await search(query)

	console.log({ summary })
}
