import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthError, getCurrentUser, UserType } from './authenticate';

describe('Authentication Module', () => {
  describe('AuthError', () => {
    it('creates error with status and message', () => {
      const error = new AuthError(401, 'Unauthorized');
      expect(error.status).toBe(401);
      expect(error.message).toBe('Unauthorized');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('getCurrentUser', () => {
    const mockApiUrl = 'http://api.example.com';
    const sessionId = 'test-session-id';
    const mockUser: UserType = {
      user: 'testuser',
      privileges: 'Administrator',
    };

    beforeEach(() => {
      vi.stubGlobal('process', {
        env: {
          BACK_API_URL: mockApiUrl,
        },
      });
      vi.stubGlobal('fetch', vi.fn());
    });

    it('fetches user successfully', async () => {
      const mockResponse = new Response(JSON.stringify(mockUser), {
        status: 200,
      });

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const user = await getCurrentUser(sessionId);

      expect(fetch).toHaveBeenCalledWith(`${mockApiUrl}/authenticate`, {
        headers: {
          Authorization: `X-Session-Id ${sessionId}`,
        },
      });
      expect(user).toEqual(mockUser);
    });

    it('throws AuthError on non-200 response', async () => {
      const mockResponse = new Response('Not Found', {
        status: 404,
        statusText: 'Not Found',
      });

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await expect(getCurrentUser(sessionId)).rejects.toThrow(AuthError);
      await expect(getCurrentUser(sessionId)).rejects.toMatchObject({
        status: 404,
        message: 'Not Found',
      });
    });

    it('throws AuthError on network failure', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network Error'));

      await expect(getCurrentUser(sessionId)).rejects.toThrow();
    });
  });
});
