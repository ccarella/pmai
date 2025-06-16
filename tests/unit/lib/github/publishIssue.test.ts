import { publishToGitHub, publishToGitHubWithRetry } from '@/lib/github/publishIssue'
import { Octokit } from 'octokit'

// Mock Octokit
jest.mock('octokit')

describe('publishToGitHub', () => {
  const mockParams = {
    title: 'Test Issue',
    body: 'Test issue body',
    labels: ['bug', 'high-priority'],
    assignees: ['user1'],
    accessToken: 'ghs_mocktoken',
    repository: 'owner/repo',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should successfully publish an issue to GitHub', async () => {
    const mockIssue = {
      html_url: 'https://github.com/owner/repo/issues/123',
      number: 123,
    }

    const mockCreate = jest.fn().mockResolvedValue({ data: mockIssue })
    ;(Octokit as jest.MockedClass<typeof Octokit>).mockImplementation(() => ({
      rest: {
        issues: {
          create: mockCreate,
        },
      },
    } as any))

    const result = await publishToGitHub(mockParams)

    expect(mockCreate).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      title: 'Test Issue',
      body: 'Test issue body',
      labels: ['bug', 'high-priority'],
      assignees: ['user1'],
    })
    expect(result).toEqual({
      success: true,
      issueUrl: 'https://github.com/owner/repo/issues/123',
      issueNumber: 123,
    })
  })

  it('should handle invalid repository format', async () => {
    const result = await publishToGitHub({
      ...mockParams,
      repository: 'invalid-format',
    })

    expect(result).toEqual({
      success: false,
      error: 'Invalid repository format. Expected "owner/repo"',
    })
  })

  it('should handle 404 error (repository not found)', async () => {
    const mockError = new Error('Not Found') as any
    mockError.status = 404

    const mockCreate = jest.fn().mockRejectedValue(mockError)
    ;(Octokit as jest.MockedClass<typeof Octokit>).mockImplementation(() => ({
      rest: {
        issues: {
          create: mockCreate,
        },
      },
    } as any))

    const result = await publishToGitHub(mockParams)

    expect(result).toEqual({
      success: false,
      error: 'Repository not found or access denied',
    })
  })

  it('should handle 403 error (rate limit)', async () => {
    const mockError = new Error('Forbidden') as any
    mockError.status = 403

    const mockCreate = jest.fn().mockRejectedValue(mockError)
    ;(Octokit as jest.MockedClass<typeof Octokit>).mockImplementation(() => ({
      rest: {
        issues: {
          create: mockCreate,
        },
      },
    } as any))

    const result = await publishToGitHub(mockParams)

    expect(result).toEqual({
      success: false,
      error: 'GitHub API rate limit exceeded or insufficient permissions',
    })
  })

  it('should handle 401 error (authentication failed)', async () => {
    const mockError = new Error('Unauthorized') as any
    mockError.status = 401

    const mockCreate = jest.fn().mockRejectedValue(mockError)
    ;(Octokit as jest.MockedClass<typeof Octokit>).mockImplementation(() => ({
      rest: {
        issues: {
          create: mockCreate,
        },
      },
    } as any))

    const result = await publishToGitHub(mockParams)

    expect(result).toEqual({
      success: false,
      error: 'GitHub authentication failed. Please reconnect your account',
    })
  })
})

describe('publishToGitHubWithRetry', () => {
  const mockParams = {
    title: 'Test Issue',
    body: 'Test issue body',
    accessToken: 'ghs_mocktoken',
    repository: 'owner/repo',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should succeed on first attempt', async () => {
    const mockIssue = {
      html_url: 'https://github.com/owner/repo/issues/123',
      number: 123,
    }

    const mockCreate = jest.fn().mockResolvedValue({ data: mockIssue })
    ;(Octokit as jest.MockedClass<typeof Octokit>).mockImplementation(() => ({
      rest: {
        issues: {
          create: mockCreate,
        },
      },
    } as any))

    const resultPromise = publishToGitHubWithRetry(mockParams)
    const result = await resultPromise

    expect(result).toEqual({
      success: true,
      issueUrl: 'https://github.com/owner/repo/issues/123',
      issueNumber: 123,
    })
    expect(mockCreate).toHaveBeenCalledTimes(1)
  })

  it('should retry on transient errors', async () => {
    const mockError = new Error('Network error')
    const mockIssue = {
      html_url: 'https://github.com/owner/repo/issues/123',
      number: 123,
    }

    const mockCreate = jest.fn()
      .mockRejectedValueOnce(mockError)
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce({ data: mockIssue })

    ;(Octokit as jest.MockedClass<typeof Octokit>).mockImplementation(() => ({
      rest: {
        issues: {
          create: mockCreate,
        },
      },
    } as any))

    const resultPromise = publishToGitHubWithRetry(mockParams, 3, 100)

    // Fast-forward through delays
    await jest.advanceTimersByTimeAsync(100)
    await jest.advanceTimersByTimeAsync(200)

    const result = await resultPromise

    expect(result).toEqual({
      success: true,
      issueUrl: 'https://github.com/owner/repo/issues/123',
      issueNumber: 123,
    })
    expect(mockCreate).toHaveBeenCalledTimes(3)
  })

  it('should not retry on authentication errors', async () => {
    const mockError = new Error('Unauthorized') as any
    mockError.status = 401

    const mockCreate = jest.fn().mockRejectedValue(mockError)
    ;(Octokit as jest.MockedClass<typeof Octokit>).mockImplementation(() => ({
      rest: {
        issues: {
          create: mockCreate,
        },
      },
    } as any))

    const result = await publishToGitHubWithRetry(mockParams)

    expect(result).toEqual({
      success: false,
      error: 'GitHub authentication failed. Please reconnect your account',
    })
    expect(mockCreate).toHaveBeenCalledTimes(1)
  })

  it('should fail after max retries', async () => {
    const mockError = new Error('Network error')

    const mockCreate = jest.fn().mockRejectedValue(mockError)
    ;(Octokit as jest.MockedClass<typeof Octokit>).mockImplementation(() => ({
      rest: {
        issues: {
          create: mockCreate,
        },
      },
    } as any))

    const resultPromise = publishToGitHubWithRetry(mockParams, 3, 100)

    // Fast-forward through all delays
    await jest.advanceTimersByTimeAsync(100)
    await jest.advanceTimersByTimeAsync(200)

    const result = await resultPromise

    expect(result).toEqual({
      success: false,
      error: 'Network error',
    })
    expect(mockCreate).toHaveBeenCalledTimes(3)
  })
})