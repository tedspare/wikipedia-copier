import { parseWikiDump } from '~/parse'
import { saveToDB } from '~/db'

const MAX_PAGES = 1000
export const URL =
	'https://dumps.wikimedia.org/simplewiki/latest/simplewiki-latest-pages-articles.xml.bz2'
// 'https://dumps.wikimedia.org/simplewiki/20241220/simplewiki-20241220-pages-articles-multistream-index.txt.bz2'

export async function fetchWikiDump(): Promise<Buffer> {
	console.log('Connecting...')

	const response = await fetch(URL)
	if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`)

	console.log('Connected. Buffering...')

	const compressedData = await response.arrayBuffer()

	console.log('Buffered.')

	return Buffer.from(compressedData)
}

export async function decompress(compressedData: Buffer): Promise<string> {
	console.log('Spawning decompressor...')

	try {
		const proc = Bun.spawn(['bunzip2'], {
			stdin: 'pipe',
			stdout: 'pipe',
			stderr: 'pipe'
		})

		proc.stdin.write(compressedData)
		proc.stdin.end()

		console.log('Decompressing...')

		const stdout = await new Response(proc.stdout).text()

		console.log(`Decompressed ${~~(stdout.length / 1024 / 1024)} MB.`)

		return stdout
	} catch (error) {
		console.error('Decompression failed:', error)
		console.log(error)

		throw error
	}
}

/**
 * THE MAIN ENTRYPOINT
 */
export async function importWiki() {
	const start = performance.now()

	try {
		const compressedData = await fetchWikiDump()

		console.log(`Downloaded ${~~(compressedData.length / 1024 / 1024)} MB.`)

		const xmlContent = await decompress(compressedData)

		const articles = await parseWikiDump({ xmlContent, maxPages: MAX_PAGES })

		console.log(`Saving ${articles.length} articles to DB...`)
		for (const article of articles) await saveToDB(article)

		const end = performance.now()
		console.log(`Done in ${~~(end - start)}ms`)
	} catch (error) {
		console.error('Import failed:', error)
		throw error
	}
}
