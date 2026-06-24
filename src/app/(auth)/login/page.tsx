import { LoginForm } from '@/features/auth/ui/LoginForm'

type LoginPageProps = {
	searchParams: Promise<{ reason?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
	const { reason } = await searchParams

	return (
		<div className="flex min-h-screen items-center justify-center bg-[#0D1117] p-6">
			<LoginForm logoutReason={reason} />
		</div>
	)
}
