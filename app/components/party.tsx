import { useSearchParams } from '@remix-run/react'
import { usePartySocket } from 'partysocket/react'
import { type State } from '../../types/party'

// This is a component that will connect to the partykit backend
// and display the number of connected users.
export default function Party({ host }: { host: string }) {
	const [searchParams, setSearchParams] = useSearchParams()
	const users = Number(searchParams.get('users')) || 0
	const title = searchParams.get('title') || ''
	const optionA = searchParams.get('optionA') || ''
	const optionB = searchParams.get('optionB') || ''
	const optionAVotes = Number(searchParams.get('votesA')) || 0
	const optionBVotes = Number(searchParams.get('votesB')) || 0

	usePartySocket({
		// Should use 127.0.0.1:1999 in development and use the actual partykit server
		// in production ([project].[username].partykit.dev)
		host,
		// connect to the party defined by 'poll.ts'
		party: 'poll',
		// this can be any name, we just picked 'index'
		room: 'index',
		onMessage(msgEvent) {
			const data = JSON.parse(msgEvent.data) as State
			console.log(data)
			const { total, poll } = data
			const optionA = poll?.options?.[0]
			const optionB = poll?.options?.[1]
			const optionAVotes = poll?.votes?.[0]
			const optionBVotes = poll?.votes?.[1]
			setSearchParams((prev) => {
				prev.set('users', total.toString())
				prev.set('title', title ?? '')
				prev.set('optionA', optionA ?? '')
				prev.set('optionB', optionB ?? '')
				prev.set('votesA', optionAVotes?.toString() ?? '')
				prev.set('votesB', optionBVotes?.toString() ?? '')
				return prev
			})
		},
	})

	return !users ? (
		'Connecting...'
	) : (
		<div className="mx-auto max-w-3xl text-center">
			<p className="inline-block bg-gradient-to-r from-purple-500 via-emerald-500 to-red-500 bg-clip-text py-24 text-8xl font-bold text-transparent">
				There {users > 1 ? 'are' : 'is'} {users} user
				{users > 1 ? 's' : ''} in the party!
			</p>
		</div>
	)
}
