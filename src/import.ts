import { parseWikiDump } from '~/parse'
import { saveToDB } from '~/db'

const MAX_PAGES = 10
export const URL =
	'https://dumps.wikimedia.org/simplewiki/latest/simplewiki-latest-pages-articles.xml.bz2'

export async function fetchWikiDump(): Promise<Buffer> {
	// When ready to use real URL:
	const response = await fetch(URL)
	if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`)

	console.log('Fetched...')

	const compressedData = await response.arrayBuffer()

	console.log('Buffered...')

	return Buffer.from(compressedData)
}

export async function decompress(compressedData: Buffer): Promise<string> {
	console.log('Starting decompression...')

	const proc = Bun.spawn(['bunzip2'], {
		stdin: compressedData,
		stdout: 'pipe',
		stderr: 'pipe'
	})

	const [stdout, stderr] = await Promise.all([
		new Response(proc.stdout).text(),
		new Response(proc.stderr).text()
	])

	if (proc.exitCode !== 0) {
		console.error('Decompression failed:', stderr)
		throw new Error(`bunzip2 failed: ${stderr}`)
	}

	console.log('Decompression completed.')
	return stdout
}

/**
 * THE MAIN ENTRYPOINT
 */
export async function importWiki() {
	const start = performance.now()

	try {
		console.log('Fetching...')
		const compressedData = await fetchWikiDump()

		console.log('Decompressing...')
		const xmlContent = await decompress(compressedData)

		console.log('Parsing XML...')
		const articles = await parseWikiDump({ xmlContent, maxPages: MAX_PAGES })

		console.log('Saving to DB...')
		for (const article of articles) await saveToDB(article)

		const end = performance.now()
		console.log(`Done in ${~~(end - start)}ms`)
	} catch (error) {
		console.error('Import failed:', error)
		throw error
	}
}
