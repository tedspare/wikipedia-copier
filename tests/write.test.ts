import { test, describe, expect } from 'bun:test'
import { existsSync } from 'node:fs'

const FILE_PATH = `${__dirname}/test.txt`
const CONTENT_LENGTH = 100_000
const MAX_DURATION = 100

const randomString = (length: number): string => {
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
	let content = ''
	for (let i = 0; i < length; i++) {
		content += characters.charAt(Math.floor(Math.random() * characters.length))
	}
	return content
}

describe('File Write Tests', () => {
	test(`should write a large file in under ${MAX_DURATION}ms`, async () => {
		const content = randomString(CONTENT_LENGTH)

		const start = performance.now()
		await Bun.write(FILE_PATH, content)
		const duration = performance.now() - start

		expect(duration).toBeLessThan(MAX_DURATION)
	})

	test('should write correct content to file', async () => {
		const content = randomString(CONTENT_LENGTH)
		await Bun.write(FILE_PATH, content)

		expect(existsSync(FILE_PATH)).toBe(true)

		const file = Bun.file(FILE_PATH)
		const writtenContent = await file.text()
		expect(writtenContent).toBe(content)
	})
})
