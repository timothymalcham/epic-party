// We use this 'party' to get and broadcast presence information
// from all connected users. We'll use this to show how many people
// are connected to the room.

import type { State } from '../types/party'
import type * as Party from 'partykit/server'

export default class Server implements Party.Server {
	// eslint-disable-next-line no-useless-constructor
	constructor(public room: Party.Room) {}

	// we'll store the state in memory
	state: State = {
		total: 0,
	}
	// let's opt in to hibernation mode, for much higher concurrency
	// like, 1000s of people in a room 🤯
	// This has tradeoffs for the developer, like needing to hydrate/rehydrate
	// state on start, so be careful!
	static options = {
		hibernate: true,
	}

	// This is called every time a new room is made
	// since we're using hibernation mode, we should
	// "rehydrate" this.state here from all connections
	onStart(): void | Promise<void> {
		for (const _ of this.room.getConnections<{ from: string }>()) {
			this.state = {
				total: this.state.total + 1,
			}
		}
	}

	// This is called every time a new connection is made
	async onConnect(): Promise<void> {
		// and update our state
		this.state = {
			total: this.state.total + 1,
		}
		// finally, let's broadcast the new state to all connections
		this.room.broadcast(JSON.stringify(this.state))
	}

	// This is called every time a connection is closed
	async onClose(connection: Party.Connection<{ from: string }>): Promise<void> {
		// let's update our state
		this.state = {
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
}

Server satisfies Party.Worker
