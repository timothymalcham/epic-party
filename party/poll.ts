// We use this 'party' to get and broadcast presence information
// from all connected users. We'll use this to show how many people
// are connected to the room.

import type * as Party from 'partykit/server'
import { type State } from '../types/party'

export default class Poll implements Party.Server {
	// let's opt in to hibernation mode, for much higher concurrency
	// like, 1000s of people in a room 🤯
	// This has tradeoffs for the developer, like needing to hydrate/rehydrate
	// state on start, so be careful!
	static options = {
		hibernate: true,
	}

	// we'll store the state in memory
	state: State = {
		total: 0,
		poll: null,
	}

	constructor(public room: Party.Room) {}

	// This is called every time a new room is made
	// since we're using hibernation mode, we should
	// "rehydrate" this.state here from all connections
	onStart(): void | Promise<void> {
		for (const _ of this.room.getConnections<{ from: string }>()) {
			this.state = {
				...this.state,
				total: this.state.total + 1,
			}
		}
	}

	// This is called every time a new connection is made
	async onConnect(): Promise<void> {
		// and update our state
		this.state = {
			...this.state,
			total: this.state.total + 1,
		}
		// finally, let's broadcast the new state to all connections
		this.room.broadcast(JSON.stringify(this.state))
	}

	// This is called every time a connection is closed
	async onClose(connection: Party.Connection<{ from: string }>): Promise<void> {
		// let's update our state
		this.state = {
			...this.state,
			total: this.state.total - 1,
		}
		// finally, let's broadcast the new state to all connections
		this.room.broadcast(JSON.stringify(this.state))
	}

	// This is called when a connection has an error
	async onError(
		connection: Party.Connection<{ from: string }>,
		err: Error,
	): Promise<void> {
		// let's log the error
		console.error('Partykit Poll.ts error: ', err)
		// and close the connection
		await this.onClose(connection)
	}

	async onRequest(req: Party.Request) {
		if (req.method === 'POST') {
			const data = (await req.json()) as State
			this.state = {
				...this.state,
				poll: data.poll
					? {
							title: data.poll.title,
							options: data.poll.options,
							votes: data.poll.options.map(() => 0),
						}
					: null,
			}
		}

		if (this.state.poll) {
			return new Response(JSON.stringify(this.state.poll), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			})
		}

		return new Response('Not found', { status: 404 })
	}
}

Poll satisfies Party.Worker
