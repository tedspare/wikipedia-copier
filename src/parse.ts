import { embed } from '~/embed'
import type { Article } from './types'

// NOTE: This is not robust. For large dumps, you'll want a streaming XML parser.
export async function parseWikiDump({
	xmlContent,
	maxPages
}: { xmlContent: string; maxPages: number }) {
	const results: Article[] = []

	console.log('Parsing...')

	// Split pages by <page>...</page>
	const pages = xmlContent.split(/<\/page>/)

	for (const pageXml of pages.slice(0, Math.min(maxPages, pages.length - 1))) {
		const titleMatch = pageXml.match(/<title>(.*?)<\/title>/)
		const textMatch = pageXml.match(/<text[^>]*>([\s\S]*?)<\/text>/)

		if (!titleMatch || !titleMatch[1]) {
			console.error('No title found')
			continue
		}

		if (!textMatch || !textMatch[1]) {
			console.error(`No text found for ${titleMatch[1]}`)
			continue
		}

		// Skip file/image tags and find first real paragraph
		const paragraphs = textMatch[1]
			.split(/\n\n|\r\n\r\n/)
			.map(p => p.trim())
			.filter(p => p && !p.startsWith('[[File:') && !p.startsWith('[[Image:'))
			.map(p =>
				p
					// Remove references
					.replace(/\[\[ref\]\].*?\[\[\/ref\]\]|\<ref\>.*?\<\/ref\>|\[\[ref.*?\]\]/g, '')
					// Remove templates/infoboxes {{...}}
					.replace(/\{\{[^\{\}]*\}\}/g, '')
					// Clean up remaining [[links]] to just show text
					.replace(/\[\[([^\]\|]+?)\]\]/g, '$1')
					.replace(/\[\[([^\]]*?)\|(.*?)\]\]/g, '$2')
					// Remove any leftover markup and clean whitespace
					.trim()
			)

		const paragraph = paragraphs[0]?.replace(/\s+/g, ' ')

		if (!paragraph) {
			console.error('No valid paragraph found')
			continue
		}

		// Embeddings
		const title = titleMatch[1].trim()
		const [{ embedding: titleEmbedding }, { embedding: paragraphEmbedding }] = await Promise.all([
			embed(title),
			embed(paragraph)
		])

		results.push({ title, paragraph, titleEmbedding, paragraphEmbedding })
	}

	console.log(`Parsed ${results.length} articles.`)

	return results
}
