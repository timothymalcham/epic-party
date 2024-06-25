import { z } from 'zod'
import {
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	json,
} from '@remix-run/node'
import { parseWithZod } from '@conform-to/zod'
import { requireUserId } from '#app/utils/auth.server.ts'

const schema = z.object({
	title: z.string(),
	optionA: z.string(),
	optionB: z.string(),
})

export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserId(request)
	return json({ status: 'idle' })
}

export async function action({ request }: ActionFunctionArgs) {
	await requireUserId(request)

	const formData = await request.formData()
	const submission = parseWithZod(formData, {
		schema,
	})

	if (submission.status !== 'success') {
		return json(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}
}

export default function CreatePollRoute() {
	return <div>Create Poll</div>
}
