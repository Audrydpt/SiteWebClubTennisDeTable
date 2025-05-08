import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCallback, useState } from 'react';
import { describe, expect, it } from 'vitest';
import useLatest from './use-latest';

describe('useLatest', () => {
  // Test component to test the hook with primitive values
  function TestComponent() {
    const [count, setCount] = useState(0);
    const latestCount = useLatest(count);

    // This function captures the value at call time
    const capturedCount = count;

    // This function will read from the ref which always has latest value
    const getLatestCount = () => latestCount.current;

    return (
      <div>
        <div data-testid="count">{count}</div>
        <div data-testid="captured-count">{capturedCount}</div>
        <div data-testid="latest-count">{latestCount.current}</div>
        <button
          data-testid="increment"
          onClick={() => setCount((prev) => prev + 1)}
          type="button"
        >
          Increment
        </button>
        <button
          data-testid="get-latest"
          onClick={() => {
            const latest = getLatestCount();
            document.getElementById('latest-value')!.textContent =
              latest.toString();
          }}
          type="button"
        >
          Get Latest
        </button>
        <div id="latest-value" data-testid="latest-value" />
      </div>
    );
  }

  // Test component for objects
  function TestObjectComponent() {
    const [user, setUser] = useState({ name: 'John', age: 30 });
    const latestUser = useLatest(user);

    return (
      <div>
        <div data-testid="user-name">{user.name}</div>
        <div data-testid="user-age">{user.age}</div>
        <div data-testid="latest-user-name">{latestUser.current.name}</div>
        <div data-testid="latest-user-age">{latestUser.current.age}</div>
        <button
          data-testid="update-name"
          onClick={() => setUser((prev) => ({ ...prev, name: 'Jane' }))}
          type="button"
        >
          Update Name
        </button>
        <button
          data-testid="update-age"
          onClick={() => setUser((prev) => ({ ...prev, age: 31 }))}
          type="button"
        >
          Update Age
        </button>
      </div>
    );
  }

  // Test component for closure problem demonstration
  function ClosureTestComponent() {
    const [count, setCount] = useState(0);
    const latestCount = useLatest(count);

    // This callback will be created once but always reads latest value
    const handleClick = useCallback(() => {
      document.getElementById('closure-value')!.textContent =
        latestCount.current.toString();
    }, [latestCount]);

    return (
      <div>
        <div data-testid="count">{count}</div>
        <button
          data-testid="increment"
          onClick={() => setCount((prev) => prev + 1)}
          type="button"
        >
          Increment
        </button>
        <button
          data-testid="get-via-closure"
          onClick={handleClick}
          type="button"
        >
          Get Latest via Closure
        </button>
        <div id="closure-value" data-testid="closure-value" />
      </div>
    );
  }

  describe('Basic Rendering', () => {
    it('should return a ref with the initial value', () => {
      render(<TestComponent />);

      expect(screen.getByTestId('count').textContent).toBe('0');
      expect(screen.getByTestId('latest-count').textContent).toBe('0');
    });
  });

  describe('Interaction Tests', () => {
    it('should update the ref when the value changes', async () => {
      const user = userEvent.setup();
      render(<TestComponent />);

      // Initial state
      expect(screen.getByTestId('count').textContent).toBe('0');
      expect(screen.getByTestId('latest-count').textContent).toBe('0');

      // Update count
      await user.click(screen.getByTestId('increment'));

      // After update
      expect(screen.getByTestId('count').textContent).toBe('1');
      expect(screen.getByTestId('latest-count').textContent).toBe('1');
    });

    it('should always return the latest value via ref', async () => {
      const user = userEvent.setup();
      render(<TestComponent />);

      // Update count
      await user.click(screen.getByTestId('increment'));

      // Get latest value via button click
      await user.click(screen.getByTestId('get-latest'));

      // Verify the latest value is accessible
      expect(screen.getByTestId('latest-value').textContent).toBe('1');

      // Update again
      await user.click(screen.getByTestId('increment'));

      // Get updated latest value
      await user.click(screen.getByTestId('get-latest'));

      // Verify latest value updated
      expect(screen.getByTestId('latest-value').textContent).toBe('2');
    });

    it('should handle object values correctly', async () => {
      const user = userEvent.setup();
      render(<TestObjectComponent />);

      // Initial state
      expect(screen.getByTestId('user-name').textContent).toBe('John');
      expect(screen.getByTestId('user-age').textContent).toBe('30');
      expect(screen.getByTestId('latest-user-name').textContent).toBe('John');
      expect(screen.getByTestId('latest-user-age').textContent).toBe('30');

      // Update name
      await user.click(screen.getByTestId('update-name'));

      // Verify name updated in both state and ref
      expect(screen.getByTestId('user-name').textContent).toBe('Jane');
      expect(screen.getByTestId('latest-user-name').textContent).toBe('Jane');

      // Update age
      await user.click(screen.getByTestId('update-age'));

      // Verify age updated in both state and ref
      expect(screen.getByTestId('user-age').textContent).toBe('31');
      expect(screen.getByTestId('latest-user-age').textContent).toBe('31');
    });
  });

  describe('Closure Problem Solution', () => {
    it('should solve the closure problem by always providing the latest value', async () => {
      const user = userEvent.setup();
      render(<ClosureTestComponent />);

      // Initial state
      expect(screen.getByTestId('count').textContent).toBe('0');

      // Get value via closure - should be 0 at first
      await user.click(screen.getByTestId('get-via-closure'));
      expect(screen.getByTestId('closure-value').textContent).toBe('0');

      // Update count multiple times
      await user.click(screen.getByTestId('increment'));
      await user.click(screen.getByTestId('increment'));

      // Count should be 2 now
      expect(screen.getByTestId('count').textContent).toBe('2');

      // Get value via the SAME closure - should provide latest value (2)
      await user.click(screen.getByTestId('get-via-closure'));
      expect(screen.getByTestId('closure-value').textContent).toBe('2');
    });
  });

  describe('Edge Cases', () => {
    it('should work with null and undefined values', () => {
      function TestNullComponent() {
        const [value, setValue] = useState<string | null | undefined>(
          'initial'
        );
        const latestValue = useLatest(value);

        return (
          <div>
            <div data-testid="value">{JSON.stringify(value)}</div>
            <div data-testid="latest-value">
              {JSON.stringify(latestValue.current)}
            </div>
            <button
              data-testid="set-null"
              onClick={() => setValue(null)}
              type="button"
            >
              Set Null
            </button>
            <button
              data-testid="set-undefined"
              onClick={() => setValue(undefined)}
              type="button"
            >
              Set Undefined
            </button>
          </div>
        );
      }

      userEvent.setup();
      render(<TestNullComponent />);

      // Initial state
      expect(screen.getByTestId('value').textContent).toBe('"initial"');
      expect(screen.getByTestId('latest-value').textContent).toBe('"initial"');

      // Set to null
      act(() => {
        screen.getByTestId('set-null').click();
      });

      expect(screen.getByTestId('value').textContent).toBe('null');
      expect(screen.getByTestId('latest-value').textContent).toBe('null');

      // Set to undefined
      act(() => {
        screen.getByTestId('set-undefined').click();
      });

      expect(screen.getByTestId('value').textContent).toBe('');
      expect(screen.getByTestId('latest-value').textContent).toBe('');
    });
  });
});
