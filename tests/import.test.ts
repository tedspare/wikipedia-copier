import { describe, expect, test } from 'bun:test'
import { decompress } from '~/import'

describe('decompress', () => {
	test('should correctly decompress bz2 test file', async () => {
		const compressedData = await Bun.file(`${__dirname}/wiki-head.xml.bz2`).arrayBuffer()
		const buffer = Buffer.from(compressedData)

		// Act
		const decompressed = await decompress(buffer)

		// Assert
		expect(decompressed).toBeTruthy()
		expect(decompressed.length - 50000).toBeLessThan(10) // Ensure at least 50k chars
		expect(decompressed).toContain('<mediawiki') // Should start with opening mediawiki tag
	})
})
