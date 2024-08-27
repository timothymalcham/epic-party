// This is a shared file between the server and the client,
// showing the types of messages being passed between them.

// Keeping this simple, we send only one type of message
// (a total count of all connections)

export type State = {
	total: number
	poll: {
		title?: string
		options: Array<string>
		votes?: Array<number>
	} | null
}
