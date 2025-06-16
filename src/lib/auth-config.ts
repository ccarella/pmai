// Check if we're in a build environment without proper env vars
export const isGitHubAuthConfigured = () => {
  return !!(
    process.env.GITHUB_CLIENT_ID &&
    process.env.GITHUB_CLIENT_ID !== 'dummy-client-id' &&
    process.env.GITHUB_CLIENT_SECRET &&
    process.env.GITHUB_CLIENT_SECRET !== 'dummy-client-secret' &&
    process.env.NEXTAUTH_SECRET &&
    process.env.NEXTAUTH_SECRET !== 'dummy-secret-for-build'
  )
}

export const isRedisConfigured = () => {
  return !!(
    process.env.KV_REST_API_URL &&
    process.env.KV_REST_API_URL !== 'https://localhost' &&
    process.env.KV_REST_API_TOKEN &&
    process.env.KV_REST_API_TOKEN !== 'dummy-token'
  )
}