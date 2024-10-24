export default function TailwindSizeIndicator() {
  return (
    <div className="fixed top-0 right-0 p-3 bg-gray-800 text-white z-50">
      <div className="xs:block sm:hidden">XS</div>
      <div className="hidden sm:block md:hidden">SM</div>
      <div className="hidden md:block lg:hidden">MD</div>
      <div className="hidden lg:block xl:hidden">LG</div>
      <div className="hidden xl:block 2xl:hidden">XL</div>
      <div className="hidden 2xl:block">2XL</div>
    </div>
  );
}
