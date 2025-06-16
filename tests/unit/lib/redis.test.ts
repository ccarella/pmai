import { GitHubConnection } from '@/lib/redis'

// Mock the entire @upstash/redis module
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  })),
}))

// Import after mocking
const { githubConnections, redis } = require('@/lib/redis')

describe('GitHub Connections Redis Helper', () => {
  const mockConnection: GitHubConnection = {
    id: 'user123',
    userId: 'user123',
    accessToken: 'ghs_mocktoken123',
    refreshToken: 'ghr_mockrefresh123',
    selectedRepo: 'owner/repo',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('get', () => {
    it('should retrieve a GitHub connection by userId', async () => {
      ;(redis.get as jest.Mock).mockResolvedValue(mockConnection)

      const result = await githubConnections.get('user123')

      expect(redis.get).toHaveBeenCalledWith('github:user123')
      expect(result).toEqual(mockConnection)
    })

    it('should return null if no connection exists', async () => {
      ;(redis.get as jest.Mock).mockResolvedValue(null)

      const result = await githubConnections.get('user123')

      expect(redis.get).toHaveBeenCalledWith('github:user123')
      expect(result).toBeNull()
    })
  })

  describe('set', () => {
    it('should store a GitHub connection', async () => {
      await githubConnections.set('user123', mockConnection)

      expect(redis.set).toHaveBeenCalledWith('github:user123', mockConnection)
    })
  })

  describe('delete', () => {
    it('should delete a GitHub connection', async () => {
      await githubConnections.delete('user123')

      expect(redis.del).toHaveBeenCalledWith('github:user123')
    })
  })

  describe('updateSelectedRepo', () => {
    it('should update the selected repository', async () => {
      ;(redis.get as jest.Mock).mockResolvedValue(mockConnection)

      await githubConnections.updateSelectedRepo('user123', 'newowner/newrepo')

      expect(redis.get).toHaveBeenCalledWith('github:user123')
      expect(redis.set).toHaveBeenCalledWith(
        'github:user123',
        expect.objectContaining({
          ...mockConnection,
          selectedRepo: 'newowner/newrepo',
          updatedAt: expect.any(String),
        })
      )
    })

    it('should not update if connection does not exist', async () => {
      ;(redis.get as jest.Mock).mockResolvedValue(null)

      await githubConnections.updateSelectedRepo('user123', 'newowner/newrepo')

      expect(redis.get).toHaveBeenCalledWith('github:user123')
      expect(redis.set).not.toHaveBeenCalled()
    })
  })
})