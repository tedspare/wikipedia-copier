import { describe, expect, test } from 'bun:test'
import { searchDB } from '~/db'

describe('Search functionality', () => {
	test('should return results when searching for "what is art"', async () => {
		const query = 'what is art'
		const results = await searchDB(query)

		expect(results).toBeDefined()
		expect(Array.isArray(results)).toBe(true)
		expect(results.length).toBeGreaterThan(0)

		// Check that results contain relevant information
		const firstResult = results[0]
		expect(firstResult).toHaveProperty('title')
		expect(firstResult).toHaveProperty('content')
		expect(firstResult).toHaveProperty('score')
	})
})
