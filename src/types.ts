export type Article = {
	title: string
	paragraph: string
	titleEmbedding: number[]
	paragraphEmbedding: number[]
}

export type SearchResult = {
	rowid: number
	distance: number
	title: string
	paragraph: string
}
