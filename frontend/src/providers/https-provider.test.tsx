import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import HttpsProvider from './https-provider';

describe('HttpsProvider', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalLocation = window.location;

  beforeEach(() => {
    let href = 'http://example.com';
    let protocol = 'http:';

    Object.defineProperty(window, 'location', {
      value: {
        get href() {
          return href;
        },
        set href(newHref: string) {
          href = newHref;
          protocol = `${newHref.split(':')[0]}:`;
        },
        get protocol() {
          return protocol;
        },
      },
      writable: true,
    });
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
  });

  describe('in development environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should not redirect HTTP to HTTPS', () => {
      render(
        <HttpsProvider>
          <div>Test Content</div>
        </HttpsProvider>
      );

      expect(window.location.href).toBe('http://example.com');
      expect(window.location.protocol).toBe('http:');
    });

    it('should render children', () => {
      const { getByText } = render(
        <HttpsProvider>
          <div>Test Content</div>
        </HttpsProvider>
      );

      expect(getByText('Test Content')).toBeInTheDocument();
    });
  });

  describe('in production environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('should redirect HTTP to HTTPS', () => {
      render(
        <HttpsProvider>
          <div>Test Content</div>
        </HttpsProvider>
      );

      expect(window.location.href).toBe('https://example.com');
      expect(window.location.protocol).toBe('https:');
    });

    it('should not redirect if already using HTTPS', () => {
      window.location.href = 'https://example.com';

      render(
        <HttpsProvider>
          <div>Test Content</div>
        </HttpsProvider>
      );

      expect(window.location.href).toBe('https://example.com');
      expect(window.location.protocol).toBe('https:');
    });

    it('should render children', () => {
      const { getByText } = render(
        <HttpsProvider>
          <div>Test Content</div>
        </HttpsProvider>
      );

      expect(getByText('Test Content')).toBeInTheDocument();
    });
  });
});
