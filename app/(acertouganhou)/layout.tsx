

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
<main className="dark bg-[#080b09] flex text-white ">
    {children}
</main>  );
}
