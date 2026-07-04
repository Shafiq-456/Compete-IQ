import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'

  // If GITHUB_CLIENT_ID is not configured in .env, redirect to the mock authorize page
  if (!clientId) {
    console.log('[auth/github] GITHUB_CLIENT_ID not configured, redirecting to mock authorize page...')
    return NextResponse.redirect(`${appUrl}/auth/github-mock`)
  }

  const redirectUri = `${appUrl}/api/auth/callback/github`
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email`

  return NextResponse.redirect(githubAuthUrl)
}
