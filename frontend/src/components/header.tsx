import { cn } from '@/lib/utils';

type HeaderProps = {
  title: string;
  children: React.ReactNode;
} & React.ComponentProps<'div'>;

export default function Header({
  title,
  children,
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
      <h1 className="text-3xl font-bold">{title}</h1>
      <div className="flex space-x-2">{children}</div>
    </div>
  );
}
