import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Octokit } from 'octokit';
import { PATCH } from '../route';
import { githubConnections } from '@/lib/redis';

// Mock the dependencies
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/redis', () => ({
  githubConnections: {
    get: jest.fn(),
  },
}));

jest.mock('octokit', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    rest: {
      issues: {
        update: jest.fn(),
        setLabels: jest.fn(),
        addLabels: jest.fn(),
        removeLabel: jest.fn(),
      },
    },
  })),
}));

describe('/api/github/issues PATCH', () => {
  const mockSession = {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
    },
  };

  const mockConnection = {
    accessToken: 'test-token',
    selectedRepo: 'owner/repo',
  };

  let mockOctokit: ReturnType<typeof Octokit>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOctokit = new (Octokit as jest.MockedClass<typeof Octokit>)();
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (githubConnections.get as jest.Mock).mockResolvedValue(mockConnection);
  });

  it('should update issue title successfully', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/github/issues', {
      method: 'PATCH',
      body: JSON.stringify({
        issueNumber: 123,
        title: 'Updated Issue Title',
      }),
    });

    mockOctokit.rest.issues.update.mockResolvedValueOnce({
      data: {
        id: 1,
        number: 123,
        title: 'Updated Issue Title',
        state: 'open',
      },
    });

    const response = await PATCH(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockOctokit.rest.issues.update).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      issue_number: 123,
      title: 'Updated Issue Title',
    });
  });

  it('should update issue body successfully', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/github/issues', {
      method: 'PATCH',
      body: JSON.stringify({
        issueNumber: 123,
        body: 'Updated issue description',
      }),
    });

    mockOctokit.rest.issues.update.mockResolvedValueOnce({
      data: {
        id: 1,
        number: 123,
        body: 'Updated issue description',
        state: 'open',
      },
    });

    const response = await PATCH(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockOctokit.rest.issues.update).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      issue_number: 123,
      body: 'Updated issue description',
    });
  });

  it('should update issue labels successfully', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/github/issues', {
      method: 'PATCH',
      body: JSON.stringify({
        issueNumber: 123,
        labels: ['bug', 'enhancement'],
      }),
    });

    mockOctokit.rest.issues.setLabels.mockResolvedValueOnce({
      data: [
        { id: 1, name: 'bug', color: 'ff0000' },
        { id: 2, name: 'enhancement', color: '00ff00' },
      ],
    });

    const response = await PATCH(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockOctokit.rest.issues.setLabels).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      issue_number: 123,
      labels: ['bug', 'enhancement'],
    });
  });

  it('should update multiple fields at once', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/github/issues', {
      method: 'PATCH',
      body: JSON.stringify({
        issueNumber: 123,
        title: 'New Title',
        body: 'New Body',
        labels: ['feature'],
      }),
    });

    mockOctokit.rest.issues.update.mockResolvedValueOnce({
      data: {
        id: 1,
        number: 123,
        title: 'New Title',
        body: 'New Body',
        state: 'open',
      },
    });

    mockOctokit.rest.issues.setLabels.mockResolvedValueOnce({
      data: [{ id: 1, name: 'feature', color: '0000ff' }],
    });

    const response = await PATCH(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockOctokit.rest.issues.update).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      issue_number: 123,
      title: 'New Title',
      body: 'New Body',
    });
    expect(mockOctokit.rest.issues.setLabels).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      issue_number: 123,
      labels: ['feature'],
    });
  });

  it('should return 401 if not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const mockRequest = new NextRequest('http://localhost:3000/api/github/issues', {
      method: 'PATCH',
      body: JSON.stringify({
        issueNumber: 123,
        title: 'Updated Title',
      }),
    });

    const response = await PATCH(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Not authenticated');
  });

  it('should return 400 if GitHub not connected', async () => {
    (githubConnections.get as jest.Mock).mockResolvedValue(null);

    const mockRequest = new NextRequest('http://localhost:3000/api/github/issues', {
      method: 'PATCH',
      body: JSON.stringify({
        issueNumber: 123,
        title: 'Updated Title',
      }),
    });

    const response = await PATCH(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('GitHub not connected');
  });

  it('should return 400 if issue number is missing', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/github/issues', {
      method: 'PATCH',
      body: JSON.stringify({
        title: 'Updated Title',
      }),
    });

    const response = await PATCH(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Issue number is required');
  });

  it('should return 400 if no fields to update', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/github/issues', {
      method: 'PATCH',
      body: JSON.stringify({
        issueNumber: 123,
      }),
    });

    const response = await PATCH(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('At least one field to update is required');
  });

  it('should handle API errors gracefully', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/github/issues', {
      method: 'PATCH',
      body: JSON.stringify({
        issueNumber: 123,
        title: 'Updated Title',
      }),
    });

    mockOctokit.rest.issues.update.mockRejectedValueOnce(new Error('API Error'));

    const response = await PATCH(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to update issue');
  });
});