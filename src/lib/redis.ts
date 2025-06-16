import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.KV_REST_API_URL || 'https://localhost',
  token: process.env.KV_REST_API_TOKEN || 'dummy-token',
})

// Helper functions for GitHub connection data
export interface GitHubConnection {
  id: string
  userId: string
  accessToken: string
  refreshToken?: string
  selectedRepo?: string
  addedRepos?: string[] // Array of repository full names (owner/repo)
  createdAt: string
  updatedAt: string
}

export const githubConnections = {
  async get(userId: string): Promise<GitHubConnection | null> {
    const data = await redis.get(`github:${userId}`)
    return data as GitHubConnection | null
  },

  async set(userId: string, connection: GitHubConnection): Promise<void> {
    await redis.set(`github:${userId}`, connection)
  },

  async delete(userId: string): Promise<void> {
    await redis.del(`github:${userId}`)
  },

  async updateSelectedRepo(userId: string, repoFullName: string): Promise<void> {
    const connection = await githubConnections.get(userId)
    if (connection) {
      connection.selectedRepo = repoFullName
      // Also add to addedRepos if not already there
      if (!connection.addedRepos) {
        connection.addedRepos = []
      }
      if (!connection.addedRepos.includes(repoFullName)) {
        connection.addedRepos.push(repoFullName)
      }
      connection.updatedAt = new Date().toISOString()
      await githubConnections.set(userId, connection)
    }
  },

  async addRepository(userId: string, repoFullName: string): Promise<void> {
    const connection = await githubConnections.get(userId)
    if (connection) {
      if (!connection.addedRepos) {
        connection.addedRepos = []
      }
      if (!connection.addedRepos.includes(repoFullName)) {
        connection.addedRepos.push(repoFullName)
      }
      connection.updatedAt = new Date().toISOString()
      await githubConnections.set(userId, connection)
    }
  },

  async removeRepository(userId: string, repoFullName: string): Promise<void> {
    const connection = await githubConnections.get(userId)
    if (connection && connection.addedRepos) {
      connection.addedRepos = connection.addedRepos.filter(repo => repo !== repoFullName)
      // If removing the selected repo, clear selection
      if (connection.selectedRepo === repoFullName) {
        connection.selectedRepo = undefined
      }
      connection.updatedAt = new Date().toISOString()
      await githubConnections.set(userId, connection)
    }
  }
}