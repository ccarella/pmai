import { Octokit } from 'octokit'

export interface PublishIssueParams {
  title: string
  body: string
  labels?: string[]
  assignees?: string[]
  accessToken: string
  repository: string
}

export interface PublishIssueResult {
  success: boolean
  issueUrl?: string
  issueNumber?: number
  error?: string
}

export async function publishToGitHub(params: PublishIssueParams): Promise<PublishIssueResult> {
  try {
    const { title, body, labels, assignees, accessToken, repository } = params
    
    // Parse repository owner and name
    const [owner, repo] = repository.split('/')
    
    if (!owner || !repo) {
      return {
        success: false,
        error: 'Invalid repository format. Expected "owner/repo"',
      }
    }

    const octokit = new Octokit({
      auth: accessToken,
    })

    // Create the issue
    const { data: issue } = await octokit.rest.issues.create({
      owner,
      repo,
      title,
      body,
      labels,
      assignees,
    })

    return {
      success: true,
      issueUrl: issue.html_url,
      issueNumber: issue.number,
    }
  } catch (error: any) {
    console.error('Error publishing to GitHub:', error)
    
    let errorMessage = 'Failed to publish issue'
    
    if (error.status === 404) {
      errorMessage = 'Repository not found or access denied'
    } else if (error.status === 403) {
      errorMessage = 'GitHub API rate limit exceeded or insufficient permissions'
    } else if (error.status === 401) {
      errorMessage = 'GitHub authentication failed. Please reconnect your account'
    } else if (error.message) {
      errorMessage = error.message
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

// Retry logic for rate limiting
export async function publishToGitHubWithRetry(
  params: PublishIssueParams,
  maxRetries = 3,
  initialDelay = 1000
): Promise<PublishIssueResult> {
  let lastError: string | undefined
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const result = await publishToGitHub(params)
    
    if (result.success) {
      return result
    }
    
    lastError = result.error
    
    // Don't retry on authentication or permission errors
    if (result.error?.includes('authentication') || result.error?.includes('access denied')) {
      return result
    }
    
    // Wait before retrying (exponential backoff)
    if (attempt < maxRetries - 1) {
      const delay = initialDelay * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  return {
    success: false,
    error: lastError || 'Failed after multiple attempts',
  }
}