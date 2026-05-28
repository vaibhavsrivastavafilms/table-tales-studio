export default function Sidebar() {
  return (
    <aside className="hidden h-full rounded-3xl border border-zinc-800 bg-[#111111] p-5 xl:block">
      <h2 className="mb-10 text-2xl font-bold xl:text-3xl">
        Table Tales Studio
      </h2>

      <nav className="space-y-6 text-zinc-400">
        {["Dashboard", "Templates", "Story Ideas", "Exports", "Settings"].map(
          (item) => (
            <p
              key={item}
              className="cursor-pointer transition-colors duration-200 hover:text-white"
            >
              {item}
            </p>
          )
        )}
      </nav>
    </aside>
  );
}
