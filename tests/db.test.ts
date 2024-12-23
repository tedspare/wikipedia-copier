import { describe, expect, test, afterAll } from 'bun:test'
import { Database } from 'bun:sqlite'
import { unlinkSync } from 'node:fs'

const DB_PATH = `${__dirname}/test.db`
const TEST_USER = {
	name: 'John Doe',
	email: 'john@example.com'
}

let db: Database

describe('SQLite Database Tests', () => {
	test('can connect to database', () => {
		db = new Database(DB_PATH)
		expect(db).toBeDefined()
	})

	test('can create a table', () => {
		const query = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE
      )
    `

		const result = db.run(query)
		expect(result.lastInsertRowid).toBe(0)
	})

	test('can insert a row', () => {
		const insert = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)')
		const result = insert.run(TEST_USER.name, TEST_USER.email)

		expect(result.lastInsertRowid).toBe(1)
	})

	test('can select data', () => {
		const query = db.prepare('SELECT * FROM users WHERE name = ?')
		const user = query.get(TEST_USER.name) as { name: string; email: string }

		expect(user).toBeDefined()
		expect(user?.name).toBe(TEST_USER.name)
		expect(user?.email).toBe(TEST_USER.email)
	})
})

afterAll(() => {
	// Clean up: close the database connection
	db.close()

	// Optionally, delete the database file
	try {
		unlinkSync(DB_PATH)
	} catch (error) {
		console.error('Error cleaning up database:', error)
	}
})
