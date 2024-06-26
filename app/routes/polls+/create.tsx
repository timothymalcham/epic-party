import { z } from 'zod'
import {
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	json,
} from '@remix-run/node'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { requireUserId } from '#app/utils/auth.server.ts'
import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { Form, useActionData } from '@remix-run/react'
import { Field } from '#app/components/forms.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { useIsPending } from '#app/utils/misc.tsx'

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
							Log in
						</StatusButton>
					</div>
				</Form>
			</div>
		</div>
	)
}
