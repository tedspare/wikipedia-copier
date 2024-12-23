import { describe, it, expect } from 'bun:test'
import { parseWikiDump } from '~/parse'

describe('parseWikiDump', () => {
	it('should correctly parse the wiki dump and extract titles and paragraphs', async () => {
		// Load the test data from wiki-head.txt
		const file = Bun.file(`${__dirname}/wiki-head.txt`)
		const xmlContent = await file.text()

		// Call the parseWikiDump function
		const result = await parseWikiDump({ xmlContent, maxPages: 10 })

		console.log({ result })

		// Check if the result contains expected titles and paragraphs
		expect(result).toHaveLength(4)
		expect(result[0]?.title).toContain('April')
		expect(result[1]?.title).toContain('August')

		expect(result[0]?.paragraph).toContain('is the fourth month')
		expect(result[1]?.paragraph).toContain('is the eighth month')
	})
})
