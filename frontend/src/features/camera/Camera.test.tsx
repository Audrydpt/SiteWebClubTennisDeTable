import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Camera from './Camera';

describe('Camera', () => {
  const mockOrigin = 'http://test-server.com';
  const streamId = 1;

  beforeEach(() => {
    // Mock window.location
    const mockUrl = new URL(`${mockOrigin}/some/path`);
    vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      href: mockUrl.href,
    });
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      expect(() => render(<Camera />)).not.toThrow();
    });

    it('renders both iframes', () => {
      render(<Camera />);
      const resultsIframe = screen.getByTitle('results');
      const formIframe = screen.getByTitle('cameraForm');

      expect(resultsIframe.tagName.toLowerCase()).toBe('iframe');
      expect(formIframe.tagName.toLowerCase()).toBe('iframe');
      expect(resultsIframe).toBeInTheDocument();
      expect(formIframe).toBeInTheDocument();
    });

    it('renders with correct container classes', () => {
      const { container } = render(<Camera />);
      expect(container.firstChild).toHaveClass('flex justify-center');
    });

    it('renders table with correct width class', () => {
      const { container } = render(<Camera />);
      const table = container.querySelector('table');
      expect(table).toHaveClass('w-full');
    });
  });

  describe('URL Handling', () => {
    it('uses window.location.origin when MAIN_API_URL is not set', () => {
      process.env.MAIN_API_URL = undefined;
      render(<Camera />);

      const resultsIframe = screen.getByTitle('results') as HTMLIFrameElement;
      const formIframe = screen.getByTitle('cameraForm') as HTMLIFrameElement;

      expect(resultsIframe.src).toBe(
        `${mockOrigin}/cgi-bin/CameraView.cgi?stream=${streamId}`
      );
      expect(formIframe.src).toBe(
        `${mockOrigin}/cgi-bin/CameraForm.cgi?stream=${streamId}`
      );
    });

    it('uses MAIN_API_URL when it is set and valid', () => {
      const apiUrl = 'http://api-server.com';
      process.env.MAIN_API_URL = apiUrl;

      render(<Camera />);

      const resultsIframe = screen.getByTitle('results') as HTMLIFrameElement;
      const formIframe = screen.getByTitle('cameraForm') as HTMLIFrameElement;

      expect(resultsIframe.src).toBe(
        `${apiUrl}/cgi-bin/CameraView.cgi?stream=${streamId}`
      );
      expect(formIframe.src).toBe(
        `${apiUrl}/cgi-bin/CameraForm.cgi?stream=${streamId}`
      );
    });

    it('falls back to window.location.origin when MAIN_API_URL is invalid', () => {
      process.env.MAIN_API_URL = 'invalid-url';
      render(<Camera />);

      const resultsIframe = screen.getByTitle('results') as HTMLIFrameElement;
      const formIframe = screen.getByTitle('cameraForm') as HTMLIFrameElement;

      expect(resultsIframe.src).toBe(
        `${mockOrigin}/cgi-bin/CameraView.cgi?stream=${streamId}`
      );
      expect(formIframe.src).toBe(
        `${mockOrigin}/cgi-bin/CameraForm.cgi?stream=${streamId}`
      );
    });
  });

  describe('Iframe Configuration', () => {
    it('renders results iframe with correct attributes', () => {
      render(<Camera />);
      const iframe = screen.getByTitle('results');

      expect(iframe).toHaveAttribute('aria-label', 'Camera results view');
      expect(iframe).toHaveClass('w-full h-[800px]');
    });

    it('renders camera form iframe with correct attributes', () => {
      render(<Camera />);
      const iframe = screen.getByTitle('cameraForm');

      expect(iframe).toHaveAttribute('aria-label', 'Camera form view');
      expect(iframe).toHaveClass('w-full h-[800px]');
    });
  });

  describe('Accessibility', () => {
    it('renders iframes with descriptive titles and aria-labels', () => {
      render(<Camera />);

      const resultsIframe = screen.getByTitle('results');
      const formIframe = screen.getByTitle('cameraForm');

      expect(resultsIframe).toHaveAttribute('title', 'results');
      expect(resultsIframe).toHaveAttribute(
        'aria-label',
        'Camera results view'
      );
      expect(formIframe).toHaveAttribute('title', 'cameraForm');
      expect(formIframe).toHaveAttribute('aria-label', 'Camera form view');
    });
  });
});
