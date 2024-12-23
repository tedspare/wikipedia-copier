import { parseWikiDump } from '~/parse'
import { saveToDB } from '~/db'

const MAX_PAGES = 10
export const URL =
	'https://dumps.wikimedia.org/simplewiki/latest/simplewiki-latest-pages-articles.xml.bz2'

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

	const partialData = compressedData.subarray(0, Math.ceil(compressedData.length * 0.1))

	const proc = Bun.spawn(['bunzip2'], {
		stdin: partialData,
		stdout: 'pipe',
		stderr: 'pipe'
	})

	console.log('Decompressing...')

	const [stdout, stderr] = await Promise.all([
		new Response(proc.stdout).text(),
		new Response(proc.stderr).text()
	])

	if (proc.exitCode !== 0) {
		console.error('Decompression failed:', stderr)
		throw new Error(`bunzip2 failed: ${stderr}`)
	}

	console.log(`Decompressed ${stdout.length / 1024 / 1024} MB.`)

	return stdout
}

/**
 * THE MAIN ENTRYPOINT
 */
export async function importWiki() {
	const start = performance.now()

	try {
		const compressedData = await fetchWikiDump()

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
