import { cn } from '@/lib/utils';

export default function LoadingSpinner({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center',
        className
      )}
      {...props}
    >
      {/* Cercle extérieur */}
      <div className="absolute w-12 h-12 border-4 border-yellow-200 border-t-yellow-500 rounded-full animate-spin" />

      {/* Cercle moyen */}
      <div
        className="absolute w-8 h-8 border-2 border-yellow-300 border-t-yellow-600 rounded-full animate-spin"
        style={{
          animationDirection: 'reverse',
          animationDuration: '0.8s',
          animationDelay: '0.15s',
        }}
      />

      {/* Cercle intérieur */}
      <div className="w-4 h-4 bg-gradient-to-tr from-yellow-400 to-yellow-600 rounded-full animate-pulse" />

      {/* Points orbitaux */}
      <div
        className="absolute w-10 h-10 animate-spin"
        style={{ animationDuration: '2s' }}
      >
        <div className="absolute w-2 h-2 bg-yellow-500 rounded-full top-0 left-1/2 transform -translate-x-1/2" />
        <div className="absolute w-1.5 h-1.5 bg-yellow-400 rounded-full bottom-0 left-1/2 transform -translate-x-1/2" />
      </div>
    </div>
  );
}
