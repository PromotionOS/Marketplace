import { SignOutButton } from '@clerk/nextjs'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50">
      <div className="text-center max-w-md px-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-500 mb-6">
          SkillOS is only available to <strong>@zopsmart.com</strong> accounts.
          Please sign in with your work email.
        </p>
        <SignOutButton redirectUrl="/sign-in">
          <button className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">
            Sign out and try again
          </button>
        </SignOutButton>
      </div>
    </div>
  )
}
