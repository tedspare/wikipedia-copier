import { Database } from 'bun:sqlite'
import type { Article, SearchResult } from '~/types'
import * as sqliteVec from 'sqlite-vec'
import { embed } from './embed'

const DB_PATH = 'wiki.db'
const SQLITE_PATH = `${__dirname}/libsqlite3.dylib`
const DIMENSIONS = 1024

export async function saveToDB({ title, paragraph, titleEmbedding, paragraphEmbedding }: Article) {
	try {
		Database.setCustomSQLite(SQLITE_PATH)
	} catch (error) {
		console.warn('Error setting custom SQLite:', error)
	}

	const db = new Database(DB_PATH)

	sqliteVec.load(db)

	db.run(`CREATE VIRTUAL TABLE IF NOT EXISTS articles 
		USING vec0(
			title TEXT,
			paragraph TEXT,
			title_embedding float[${DIMENSIONS}],
			paragraph_embedding float[${DIMENSIONS}]
		)`)

	const stmt = db.prepare(
		`INSERT INTO articles(
				title, 
				paragraph, 
				title_embedding, 
				paragraph_embedding
		) 
		VALUES (?, ?, vec_f32(?), vec_f32(?))`
	)

	stmt.run(title, paragraph, new Float32Array(titleEmbedding), new Float32Array(paragraphEmbedding))
}

export async function searchDB(query: string) {
	try {
		Database.setCustomSQLite(SQLITE_PATH)
	} catch (error) {
		console.warn('Error setting custom SQLite:', error)
	}

	const db = new Database(DB_PATH)

	sqliteVec.load(db)

	const { embedding: queryEmbedding } = await embed(query)

	const rows = db
		.prepare(
			`SELECT
				rowid,
				distance,
				title,
				paragraph
			FROM articles
			WHERE paragraph_embedding MATCH ?
			ORDER BY distance
			LIMIT 3`
		)
		.all(new Float32Array(queryEmbedding)) as SearchResult[]

	return rows
}
