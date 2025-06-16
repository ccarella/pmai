'use client'

import { Card } from '@/components/ui/Card'
import Link from 'next/link'

export default function GitHubTroubleshooting() {
  return (
    <Card className="p-6 mt-6 border-warning">
      <h2 className="text-xl font-semibold mb-4 text-warning">⚠️ GitHub OAuth Troubleshooting</h2>
      
      <div className="space-y-4 text-sm">
        <div>
          <h3 className="font-semibold mb-2">1. Verify GitHub OAuth App Settings</h3>
          <p className="text-muted mb-2">Go to GitHub → Settings → Developer settings → OAuth Apps</p>
          <div className="bg-card-hover p-3 rounded font-mono text-xs space-y-1">
            <p>Homepage URL: {process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'http://localhost:3000'}</p>
            <p>Authorization callback URL: {process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/api/auth/callback/github` : 'http://localhost:3000/api/auth/callback/github'}</p>
          </div>
          <p className="text-error text-xs mt-2">⚠️ The callback URL must match EXACTLY (including http/https and trailing slashes)</p>
        </div>

        <div>
          <h3 className="font-semibold mb-2">2. Current Environment</h3>
          <div className="bg-card-hover p-3 rounded font-mono text-xs">
            <p>NEXTAUTH_URL: {process.env.NEXTAUTH_URL || 'Not set (using auto-detection)'}</p>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">3. Try These Steps</h3>
          <ol className="list-decimal list-inside space-y-2 text-muted">
            <li>
              <Link href="https://github.com/settings/applications" target="_blank" className="text-primary hover:underline">
                Revoke this app&apos;s authorization on GitHub
              </Link>
            </li>
            <li>Clear your browser cookies and cache</li>
            <li>Try re-authenticating in an incognito/private window</li>
            <li>When GitHub asks for permissions, ensure all requested permissions are checked</li>
          </ol>
        </div>

        <div>
          <h3 className="font-semibold mb-2">4. If Still Not Working</h3>
          <p className="text-muted mb-2">Create a new GitHub OAuth App with these exact settings:</p>
          <div className="bg-card-hover p-3 rounded text-xs space-y-2">
            <p><span className="font-semibold">Application name:</span> Your app name</p>
            <p><span className="font-semibold">Homepage URL:</span> Copy from above</p>
            <p><span className="font-semibold">Authorization callback URL:</span> Copy from above</p>
            <p className="text-error">Do NOT add any Application description or other optional fields initially</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted">
            Check server logs during authentication for debug output. The OAuth flow should show requested scopes in the console.
          </p>
        </div>
      </div>
    </Card>
  )
}