import { POST } from '../complete/route';
import { getServerSession } from 'next-auth';
import { markOnboardingComplete, skipOnboarding } from '@/lib/services/onboarding';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@/lib/services/onboarding');

describe('/api/onboarding/complete', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);

    const request = new Request('http://localhost/api/onboarding/complete', {
      method: 'POST',
      body: JSON.stringify({ action: 'complete' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Not authenticated' });
  });

  it('marks onboarding as complete when action is complete', async () => {
    const mockSession = { user: { id: '123' } };
    
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);
    (markOnboardingComplete as jest.Mock).mockResolvedValueOnce(undefined);

    const request = new Request('http://localhost/api/onboarding/complete', {
      method: 'POST',
      body: JSON.stringify({ action: 'complete' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });
    expect(markOnboardingComplete).toHaveBeenCalledWith('123');
  });

  it('marks onboarding as skipped when action is skip', async () => {
    const mockSession = { user: { id: '123' } };
    
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);
    (skipOnboarding as jest.Mock).mockResolvedValueOnce(undefined);

    const request = new Request('http://localhost/api/onboarding/complete', {
      method: 'POST',
      body: JSON.stringify({ action: 'skip' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });
    expect(skipOnboarding).toHaveBeenCalledWith('123');
  });

  it('returns 400 for invalid action', async () => {
    const mockSession = { user: { id: '123' } };
    
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);

    const request = new Request('http://localhost/api/onboarding/complete', {
      method: 'POST',
      body: JSON.stringify({ action: 'invalid' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Invalid action' });
  });

  it('handles errors gracefully', async () => {
    const mockSession = { user: { id: '123' } };
    
    (getServerSession as jest.Mock).mockResolvedValueOnce(mockSession);
    (markOnboardingComplete as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

    const request = new Request('http://localhost/api/onboarding/complete', {
      method: 'POST',
      body: JSON.stringify({ action: 'complete' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Failed to update onboarding status' });
  });
});