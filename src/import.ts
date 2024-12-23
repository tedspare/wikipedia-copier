/* importWiki.ts */
import { spawnSync } from 'bun'
import { parseWikiDump } from '~/parse'
import { saveToDB } from '~/db'

const MAX_PAGES = 10

// ---- Main function: fetch a small dump and parse it ----
export async function importWiki() {
	// Example: Simple English Wikipedia’s “pages-articles” dump (compressed)
	// You can pick a more up-to-date or smaller file if you want.
	const url =
		'https://dumps.wikimedia.org/simplewiki/latest/simplewiki-latest-pages-articles.xml.bz2'

	console.log('Downloading dump (bz2)...')
	const response = await fetch(url)
	if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`)

	// We’ll load entire compressed file into memory for brevity.
	// (For large dumps, use a streaming decompression approach!)
	const compressedData = Buffer.from(await response.arrayBuffer())

	console.log('Decompressing...')
	// Bun provides built-in decompression for bzip2? Not yet.
	// We'll cheat and call `spawnSync` bzip2 in your system, or you can use a library:
	const decompress = spawnSync(['bunzip2'], {
		stdin: compressedData,
		stdout: 'pipe',
		stderr: 'pipe'
	})

	if (decompress.exitCode !== 0) {
		console.error('bunzip2 failed:', decompress.stderr?.toString())
		return
	}

	const xmlContent = decompress.stdout?.toString() || ''

	console.log('Parsing XML...')
	const articles = await parseWikiDump({ xmlContent, maxPages: MAX_PAGES })

	for (const article of articles) {
		await saveToDB(article)
	}

	console.log('Done importing!')
}
