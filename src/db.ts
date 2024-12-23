import { Database } from 'bun:sqlite'
import type { Article } from '~/types'

export async function saveToDB({ title, paragraph, titleEmbedding, paragraphEmbedding }: Article) {
	// 1. Create or open an SQLite database
	const db = new Database('wiki.db')

	// 2. Create a table to store articles with embeddings
	db.run(`
  CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    paragraph TEXT,
    title_embedding BLOB,
    paragraph_embedding BLOB
  )
`)

	// Insert into SQLite
	db.run(
		`INSERT INTO articles (title, paragraph, title_embedding, paragraph_embedding)
       VALUES (?, ?, ?, ?)`,
		[
			title,
			paragraph,
			// Store embeddings as JSON or as raw BLOB. For BLOB in SQLite, we can just store Buffer.
			JSON.stringify(titleEmbedding),
			JSON.stringify(paragraphEmbedding)
		]
	)
}
