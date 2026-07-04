import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { setSessionCookie } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'

  if (!code) {
    return NextResponse.redirect(`${appUrl}/?error=no_code_provided`)
  }

  try {
    let email = ''
    let name = ''
    let githubId = ''
    let avatarUrl = 'GH'

    // Mock auth simulation pathway
    if (code === 'mock_code') {
      console.log('[auth/callback/github] Simulating successful GitHub authentication (mock mode)...')
      const paramName = searchParams.get('name') || 'GitHub Dev Guest'
      const paramEmail = searchParams.get('email') || 'github_demo@competitoriq.ai'
      githubId = 'github_mock_' + paramName.toLowerCase().replace(/[^a-z0-9]/g, '')
      email = paramEmail
      name = paramName
      avatarUrl = paramName.slice(0, 2).toUpperCase()
    } else {
      const clientId = process.env.GITHUB_CLIENT_ID
      const clientSecret = process.env.GITHUB_CLIENT_SECRET

      if (!clientId || !clientSecret) {
        throw new Error('GitHub Client ID or Secret is not configured')
      }

      // 1. Exchange OAuth code for access token
      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      })

      const tokenData = await tokenRes.json()
      if (tokenData.error) {
        throw new Error(`GitHub token exchange error: ${tokenData.error_description || tokenData.error}`)
      }

      const accessToken = tokenData.access_token

      // 2. Fetch user profile from GitHub
      const userRes = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'CompetitorIQ-Auth-Agent',
        },
      })

      const userData = await userRes.json()
      if (!userRes.ok) {
        throw new Error(`Failed to fetch GitHub profile: ${userData.message || 'Unknown error'}`)
      }

      githubId = String(userData.id)
      name = userData.name || userData.login || 'GitHub User'
      avatarUrl = (name || 'GH').slice(0, 2).toUpperCase()

      // 3. Fetch primary email if not public in profile
      email = userData.email
      if (!email) {
        const emailsRes = await fetch('https://api.github.com/user/emails', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'CompetitorIQ-Auth-Agent',
          },
        })
        const emailsData = await emailsRes.json()
        if (emailsRes.ok && Array.isArray(emailsData)) {
          const primaryEmail = emailsData.find((e: any) => e.primary && e.verified) || emailsData[0]
          email = primaryEmail?.email
        }
      }

      if (!email) {
        email = `${userData.login || githubId}@github-user.competitoriq.ai`
      }
    }

    const normalizedEmail = email.toLowerCase().trim()

    // 4. Create or update user matching either githubId or email
    let user = await db.user.findFirst({
      where: {
        OR: [
          { githubId },
          { email: normalizedEmail }
        ]
      }
    })

    if (user) {
      // Update existing user with githubId if missing
      if (!user.githubId) {
        user = await db.user.update({
          where: { id: user.id },
          data: { githubId }
        })
      }
    } else {
      // Create new user (needs onboarding)
      user = await db.user.create({
        data: {
          email: normalizedEmail,
          name,
          avatar: avatarUrl,
          githubId,
          role: 'Admin',
          hasSeenOnboarding: false,
          hasRunFirstScan: false,
        }
      })
    }

    // 5. Establish session cookie and redirect
    await setSessionCookie(user.id)
    return NextResponse.redirect(appUrl)

  } catch (err: any) {
    console.error('[auth/callback/github] Fatal OAuth processing error:', err?.message)
    return NextResponse.redirect(`${appUrl}/?error=${encodeURIComponent(err?.message || 'oauth_error')}`)
  }
}
