import { usePartySocket } from 'partysocket/react'
import { useState } from 'react'
import type { State } from '../../messages'

// This is a component that will connect to the partykit backend
// and display the number of connected users, and where they're from.
export default function WhosHere() {
	const [users, setUsers] = useState<State | undefined>()

	usePartySocket({
		host: '127.0.0.1:1999',
		// connect to the party defined by 'poll.ts'
		party: 'poll',
		// this can be any name, we just picked 'index'
		room: 'index',
		onMessage(evt) {
			const data = JSON.parse(evt.data) as State
			setUsers(data)
		},
	})

	return !users ? (
		'Connecting...'
	) : (
		<div className="presence">
			<b>Who&apos;s here?</b>
			<br />
			{users?.total} user{users?.total !== 1 ? 's' : ''} online.
		</div>
	)
}
