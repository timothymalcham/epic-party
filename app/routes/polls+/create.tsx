import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import {
	type ActionFunctionArgs,
	json,
	type LoaderFunctionArgs,
	redirect,
} from '@remix-run/node'
import { Form, useActionData } from '@remix-run/react'
import { z } from 'zod'
import { Field } from '#app/components/forms.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { useIsPending } from '#app/utils/misc.tsx'
import { type Poll } from '../../../types/party'

const randomId = () => Math.random().toString(36).substring(2, 10)

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

	const title = formData.get('title')?.toString() ?? 'Anonymous poll'
	const options: string[] = []

	for (const [key, value] of formData.entries()) {
		if (key.startsWith('option') && value.toString().trim().length > 0) {
			options.push(value.toString())
		}
	}

	const pollId = randomId()
	const poll: Poll = {
		title,
		options,
	}

	await fetch(`${process.env.PARTYKIT_URL}/party/${pollId}`, {
		method: 'POST',
		body: JSON.stringify(poll),
		headers: {
			'Content-Type': 'application/json',
		},
	})

	return redirect(`/polls/${pollId}`)
}

export default function CreatePollRoute() {
	const lastResult = useActionData<typeof action>()
	const isPending = useIsPending()

	const [form, fields] = useForm({
		id: 'create-poll',
		constraint: getZodConstraint(schema),
		lastResult: lastResult?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema })
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<div className="container mx-auto max-w-md pb-32 pt-20">
			<h1 className="pb-12 text-center text-h1">Create Poll</h1>

			<div className="w-full max-w-md pl-4">
				<Form method="POST" {...getFormProps(form)} className="mx-auto">
					<Field
						labelProps={{ children: 'Title' }}
						inputProps={{
							...getInputProps(fields.title, { type: 'text' }),
						}}
						errors={fields.title.errors}
					/>
					<Field
						labelProps={{ children: 'Option A' }}
						inputProps={{
							...getInputProps(fields.optionA, { type: 'text' }),
						}}
						errors={fields.optionA.errors}
					/>
					<Field
						labelProps={{ children: 'Option B' }}
						inputProps={{
							...getInputProps(fields.optionB, { type: 'text' }),
						}}
						errors={fields.optionB.errors}
					/>
					<div className="flex items-center justify-between gap-6 pt-3">
						<StatusButton
							className="w-full"
							status={isPending ? 'pending' : form.status ?? 'idle'}
							type="submit"
							disabled={isPending}
						>
							Create Poll
						</StatusButton>
					</div>
				</Form>
			</div>
		</div>
	)
}
