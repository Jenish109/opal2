import { onAuthenticateUser } from '@/actions/user'
import { redirect } from 'next/navigation'

const AuthCallbackPage = async () => {
  try {
    const auth = await onAuthenticateUser()
    
    // If authentication is successful, redirect to dashboard
    if (auth.status === 200 || auth.status === 201) {
      if (auth.user?.workspace?.[0]?.id) {
        return redirect(`/dashboard/${auth.user.workspace[0].id}`)
      } else {
        // If no workspace exists, redirect to a default page
        return redirect('/dashboard')
      }
    }
    
    // If authentication fails, redirect to sign-in
    return redirect('/auth/sign-in')
  } catch (error) {
    console.error('Authentication callback error:', error)
    return redirect('/auth/sign-in')
  }
}

export default AuthCallbackPage
