import { GET } from '../status/route';
import { getServerSession } from 'next-auth';
import { getOnboardingStatus } from '@/lib/services/onboarding';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@/lib/services/onboarding');

describe('/api/onboarding/status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Not authenticated' });
  });

  it('returns onboarding status when authenticated', async () => {
    const mockSession = { user: { id: '123' } };
    const mockStatus = {
      isAuthenticated: true,
      hasOpenAIKey: true,
      hasSelectedRepo: false,
      addedRepos: [],
    };

    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);
    (getOnboardingStatus as jest.Mock).mockResolvedValueOnce(mockStatus);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockStatus);
  });

  it('handles errors gracefully', async () => {
    const mockSession = { user: { id: '123' } };
    
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);
    (getOnboardingStatus as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Failed to get onboarding status' });
  });
});