import * as React from 'react';

type ToastProps = {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
};

export default function useToast() {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);

  const toast = React.useCallback((props: ToastProps) => {
    setToasts((prev) => [...prev, props]);

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 3000);
  }, []);

  return {
    toast,
    toasts,
  };
}

// Named export for backward compatibility
export { useToast };
