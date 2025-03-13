import { onAuthenticateUser } from '@/actions/user'
import { log } from 'console'
import { redirect } from 'next/navigation'

const AuthCallbackPage = async () => {
  try {
    const auth = await onAuthenticateUser()
    console.log('auth --- ', JSON.stringify(auth))
    
    // If authentication fails or has an unexpected status
    if (!auth || (auth.status !== 200 && auth.status !== 201)) {
      console.log('Auth failed with status:', auth?.status)
      return redirect('/auth/sign-in')
    }
    
    // If authentication is successful
    console.log('first if ')
    if (auth?.user?.workspace[0]?.id) {
      console.log('second if ')
      return redirect(`/dashboard/${auth?.user?.workspace[0]?.id}`)
    } else {
      console.log('else ----')
      // If no workspace exists, redirect to a default page
      return redirect('/dashboard')
    }
  } catch (error) {
    // Only catch non-redirect errors

    console.log('catch iffff ---- ',   )
    if (!(error instanceof Error) || !error.message.includes('NEXT_REDIRECT')) {
      console.error('Authentication callback error:', error)
      return redirect('/auth/sign-in')
    }
    throw error; // Re-throw redirect errors
  }
}

export default AuthCallbackPage