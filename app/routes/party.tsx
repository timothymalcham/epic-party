import { json } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import Party from '#app/components/party.tsx'

export async function loader() {
	const host = process.env.PARTYKIT_URL ?? ''
	return json({ host })
}

export default function PollRoute() {
	const { host } = useLoaderData<typeof loader>()
	return (
		<div className="container my-12">
			<Party host={host} />
		</div>
	)
}
