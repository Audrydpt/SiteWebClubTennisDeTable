export default function Header({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-row justify-between items-center w-full">
      <h1 className="text-3xl font-bold">{title}</h1>
      <div className="flex space-x-2">{children}</div>
    </div>
  );
}
