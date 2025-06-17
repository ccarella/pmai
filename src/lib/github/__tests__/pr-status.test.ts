import { fetchPRTestStatus, clearCacheInterval, clearCache } from '../pr-status';
import fetchMock from 'jest-fetch-mock';

// Enable fetch mocking
fetchMock.enableMocks();

describe('fetchPRTestStatus', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    clearCache();
  });

  afterAll(() => {
    clearCacheInterval();
  });

  const mockOwner = 'testowner';
  const mockRepo = 'testrepo';
  const mockToken = 'testtoken';

  it('returns unknown when issue is not a PR', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({
        number: 123,
        title: 'Test Issue',
        pull_request: null,
      })
    );

    const result = await fetchPRTestStatus(mockOwner, mockRepo, 123, mockToken);

    expect(result).toBe('unknown');
    expect(fetchMock).toHaveBeenCalledWith(
      `https://api.github.com/repos/${mockOwner}/${mockRepo}/issues/123`,
      {
        headers: {
          Authorization: `token ${mockToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );
  });

  it('returns success when all check runs pass', async () => {
    // Mock issue response
    fetchMock.mockResponseOnce(
      JSON.stringify({
        number: 123,
        pull_request: {},
      })
    );

    // Mock PR response
    fetchMock.mockResponseOnce(
      JSON.stringify({
        head: { sha: 'abc123' },
      })
    );

    // Mock check runs response
    fetchMock.mockResponseOnce(
      JSON.stringify({
        check_runs: [
          { status: 'completed', conclusion: 'success' },
          { status: 'completed', conclusion: 'success' },
        ],
      })
    );

    const result = await fetchPRTestStatus(mockOwner, mockRepo, 123, mockToken);

    expect(result).toBe('success');
  });

  it('returns failure when any check run fails', async () => {
    // Mock issue response
    fetchMock.mockResponseOnce(
      JSON.stringify({
        number: 123,
        pull_request: {},
      })
    );

    // Mock PR response
    fetchMock.mockResponseOnce(
      JSON.stringify({
        head: { sha: 'abc123' },
      })
    );

    // Mock check runs response
    fetchMock.mockResponseOnce(
      JSON.stringify({
        check_runs: [
          { status: 'completed', conclusion: 'success' },
          { status: 'completed', conclusion: 'failure' },
        ],
      })
    );

    const result = await fetchPRTestStatus(mockOwner, mockRepo, 123, mockToken);

    expect(result).toBe('failure');
  });

  it('returns pending when checks are running', async () => {
    // Mock issue response
    fetchMock.mockResponseOnce(
      JSON.stringify({
        number: 123,
        pull_request: {},
      })
    );

    // Mock PR response
    fetchMock.mockResponseOnce(
      JSON.stringify({
        head: { sha: 'abc123' },
      })
    );

    // Mock check runs response
    fetchMock.mockResponseOnce(
      JSON.stringify({
        check_runs: [
          { status: 'completed', conclusion: 'success' },
          { status: 'in_progress', conclusion: null },
        ],
      })
    );

    const result = await fetchPRTestStatus(mockOwner, mockRepo, 123, mockToken);

    expect(result).toBe('pending');
  });

  it('falls back to commit status API when no check runs', async () => {
    // Mock issue response
    fetchMock.mockResponseOnce(
      JSON.stringify({
        number: 123,
        pull_request: {},
      })
    );

    // Mock PR response
    fetchMock.mockResponseOnce(
      JSON.stringify({
        head: { sha: 'abc123' },
      })
    );

    // Mock check runs response (empty)
    fetchMock.mockResponseOnce(
      JSON.stringify({
        check_runs: [],
      })
    );

    // Mock commit status response
    fetchMock.mockResponseOnce(
      JSON.stringify({
        state: 'success',
        statuses: [{ state: 'success', context: 'CI' }],
      })
    );

    const result = await fetchPRTestStatus(mockOwner, mockRepo, 123, mockToken);

    expect(result).toBe('success');
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('caches results and returns cached value on subsequent calls', async () => {
    // Mock issue response
    fetchMock.mockResponseOnce(
      JSON.stringify({
        number: 123,
        pull_request: {},
      })
    );

    // Mock PR response
    fetchMock.mockResponseOnce(
      JSON.stringify({
        head: { sha: 'abc123' },
      })
    );

    // Mock check runs response
    fetchMock.mockResponseOnce(
      JSON.stringify({
        check_runs: [
          { status: 'completed', conclusion: 'success' },
        ],
      })
    );

    // First call
    const result1 = await fetchPRTestStatus(mockOwner, mockRepo, 123, mockToken);
    expect(result1).toBe('success');
    expect(fetchMock).toHaveBeenCalledTimes(3);

    // Second call should use cache
    const result2 = await fetchPRTestStatus(mockOwner, mockRepo, 123, mockToken);
    expect(result2).toBe('success');
    expect(fetchMock).toHaveBeenCalledTimes(3); // No additional calls
  });

  it('handles API errors gracefully', async () => {
    fetchMock.mockRejectOnce(new Error('Network error'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const result = await fetchPRTestStatus(mockOwner, mockRepo, 123, mockToken);

    expect(result).toBe('unknown');
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error fetching PR test status:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('handles non-ok responses', async () => {
    fetchMock.mockResponseOnce('', { status: 404 });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const result = await fetchPRTestStatus(mockOwner, mockRepo, 123, mockToken);

    expect(result).toBe('unknown');
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error fetching PR test status:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});