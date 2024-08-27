import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData, useParams } from '@remix-run/react'
import { usePartySocket } from 'partysocket/react'
import { Button } from '#app/components/ui/button.tsx'
import { type State } from '../../../types/party'

export async function loader({ params }: LoaderFunctionArgs) {
	const req = await fetch(
		`${process.env.PARTYKIT_URL}/party/${params.pollId}`,
		{ method: 'GET', headers: { 'Content-Type': 'application/json' } },
	)
	if (!req.ok) throw new Error('Failed to fetch poll')
	const data = (await req.json()) as State
	return json({ poll: data.poll, host: process.env.PARTYKIT_URL })
}

export default function PollRoute() {
	const { poll, host } = useLoaderData<typeof loader>()
	const params = useParams()

	const socket = usePartySocket({
		// Should use 127.0.0.1:1999 in development and use the actual partykit server
		// in production ([project].[username].partykit.dev)
		host,
		// room will be the pollId
		room: params.pollId,
		onMessage(msgEvent) {
			const data = JSON.parse(msgEvent.data) as State
			if (data.poll?.votes) {
				console.log(data.poll?.votes)
			}
		},
	})

	const sendVote = (option: number) => {
		socket.send(JSON.stringify({ type: 'vote', option }))
	}

	return (
		<div className="container mx-auto max-w-md pb-32 pt-20">
			{poll ? (
				<div className="w-full max-w-md pl-4">
					<h1 className="pb-12 text-center text-h1">{poll.title}</h1>
					<div className="flex flex-col gap-4">
						{poll.options.map((option, index) => (
							<div key={index} className="flex gap-2">
								<div className="w-1/2 flex-1">
									<div className="text-center text-body-md">{option}</div>
									<Button onClick={() => sendVote(index)}>Vote</Button>
								</div>
								<div className="w-1/2 flex-1">
									<div className="text-center text-body-md">{option}</div>
									<Button onClick={() => sendVote(index)}>Vote</Button>
								</div>
							</div>
						))}
					</div>
				</div>
			) : (
				<p>Poll not found :(</p>
			)}
		</div>
	)
}
