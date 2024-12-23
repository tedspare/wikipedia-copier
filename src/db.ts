import { Database } from 'bun:sqlite'
import type { Article } from '~/types'
import * as sqliteVec from 'sqlite-vec'
import { embed } from './embed'

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

export async function searchDB(query: string) {
	const db = new Database('wiki.db')

	Database.setCustomSQLite('/opt/homebrew/opt/sqlite3/lib/libsqlite3.dylib')

	sqliteVec.load(db)

	const { embedding: queryEmbedding } = await embed(query)

	const rows = db
		.prepare(
			`
				SELECT
					rowid,
					distance
				FROM vec_items
				WHERE embedding MATCH ?
				ORDER BY distance
				LIMIT 3
			`
		)
		.all(new Float32Array(queryEmbedding))

	return rows
}
