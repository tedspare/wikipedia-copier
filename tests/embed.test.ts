import { cos_sim as cosSim } from '@xenova/transformers'
import { embed } from '~/embed'
import { describe, expect, it } from 'bun:test'

describe('embedding similarity', () => {
	it('should compute similarity between texts quickly', async () => {
		const start = performance.now()

		const [a, b] = await Promise.all([
			embed('Bonn (German pronunciation: [bɔn] ⓘ) is a federal city...'), // text truncated for brevity
			embed('The Rheinisches Landesmuseum Bonn, or LVR-LandesMuseum Bonn...')
		])

		const similarity = cosSim(a.embedding, b.embedding)
		const duration = performance.now() - start

		expect(duration).toBeLessThan(100)
		expect(similarity).toBeGreaterThan(0.5)
	})
})
