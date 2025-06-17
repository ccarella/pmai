import { PRTestStatus } from '@/components/PRStatusIndicator';

interface CheckRun {
  status: string;
  conclusion: string | null;
}

interface PullRequestStatus {
  state: 'success' | 'failure' | 'pending' | null;
  statuses: Array<{
    state: string;
    context: string;
  }>;
}

interface CachedStatus {
  status: PRTestStatus;
  timestamp: number;
}

// In-memory cache for PR statuses
const statusCache = new Map<string, CachedStatus>();
const CACHE_TTL = 60000; // 1 minute TTL

export async function fetchPRTestStatus(
  owner: string,
  repo: string,
  issueNumber: number,
  accessToken: string
): Promise<PRTestStatus> {
  const cacheKey = `${owner}/${repo}/${issueNumber}`;
  
  // Check cache first
  const cached = statusCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.status;
  }

  try {
    // Check if this issue is actually a PR by fetching it directly
    const issueResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`,
      {
        headers: {
          Authorization: `token ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (!issueResponse.ok) {
      throw new Error(`GitHub API error: ${issueResponse.status}`);
    }

    const issue = await issueResponse.json();
    
    // If this is not a PR, return unknown
    if (!issue.pull_request) {
      const status: PRTestStatus = 'unknown';
      statusCache.set(cacheKey, { status, timestamp: Date.now() });
      return status;
    }

    // This is a PR, so fetch it as a PR to get the head SHA
    const prNumber = issueNumber;

    // Fetch the PR to get the head SHA
    const prResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
      {
        headers: {
          Authorization: `token ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (!prResponse.ok) {
      throw new Error(`GitHub API error: ${prResponse.status}`);
    }

    const pr = await prResponse.json();
    const headSha = pr.head.sha;

    // Fetch check runs for the PR
    const checksResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits/${headSha}/check-runs`,
      {
        headers: {
          Authorization: `token ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    let status: PRTestStatus = 'unknown';

    if (checksResponse.ok) {
      const checksData = await checksResponse.json();
      const checkRuns: CheckRun[] = checksData.check_runs || [];

      if (checkRuns.length > 0) {
        const hasFailure = checkRuns.some(run => run.conclusion === 'failure');
        const hasPending = checkRuns.some(run => run.status === 'in_progress' || run.status === 'queued');
        const allSuccess = checkRuns.every(run => run.conclusion === 'success');

        if (hasFailure) {
          status = 'failure';
        } else if (hasPending) {
          status = 'pending';
        } else if (allSuccess) {
          status = 'success';
        }
      }
    }

    // If no check runs, try commit status API
    if (status === 'unknown') {
      const statusResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/commits/${headSha}/status`,
        {
          headers: {
            Authorization: `token ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      if (statusResponse.ok) {
        const statusData: PullRequestStatus = await statusResponse.json();
        
        if (statusData.state === 'success') {
          status = 'success';
        } else if (statusData.state === 'failure') {
          status = 'failure';
        } else if (statusData.state === 'pending') {
          status = 'pending';
        }
      }
    }

    // Cache the result
    statusCache.set(cacheKey, { status, timestamp: Date.now() });
    return status;
  } catch (error) {
    console.error('Error fetching PR test status:', error);
    // Cache the error state to avoid repeated failures
    const status: PRTestStatus = 'unknown';
    statusCache.set(cacheKey, { status, timestamp: Date.now() });
    return status;
  }
}

// Clear cache periodically to prevent memory leaks
let cacheCleanupInterval: NodeJS.Timeout | null = null;

if (typeof window !== 'undefined' || typeof process !== 'undefined') {
  cacheCleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of statusCache.entries()) {
      if (now - value.timestamp > CACHE_TTL * 10) {
        statusCache.delete(key);
      }
    }
  }, CACHE_TTL * 10);
}

// Export for testing purposes
export const clearCacheInterval = () => {
  if (cacheCleanupInterval) {
    clearInterval(cacheCleanupInterval);
    cacheCleanupInterval = null;
  }
};

export const clearCache = () => {
  statusCache.clear();
};