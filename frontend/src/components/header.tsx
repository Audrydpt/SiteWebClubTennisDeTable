import { cn } from '@/lib/utils';

type HeaderProps = {
  title: string;
  children?: React.ReactNode;
  level?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
} & React.ComponentProps<'div'>;

export default function Header({
  title,
  children,
  level = 'h1',
  className,
  ...props
}: HeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-row justify-between items-center w-full',
        className
      )}
      {...props}
    >
      {level === 'h1' && <h1 className="text-3xl font-bold mb-4">{title}</h1>}
      {level === 'h2' && <h2 className="text-2xl font-bold mb-3">{title}</h2>}
      {level === 'h3' && <h3 className="text-xl font-bold mb-2">{title}</h3>}
      {level === 'h4' && <h4 className="text-lg font-bold mb-1">{title}</h4>}
      {level === 'h5' && <h5 className="text-base font-bold mb-1">{title}</h5>}
      {level === 'h6' && <h6 className="text-sm font-bold mb-1">{title}</h6>}

      <div className="flex space-x-2">{children}</div>
    </div>
  );
}
