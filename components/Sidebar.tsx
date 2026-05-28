export default function Sidebar() {
    return (
      <div className="col-span-2 bg-[#111111] rounded-3xl p-5 border border-zinc-800 h-full">
        <h2 className="text-3xl font-bold mb-10">
          Table Tales Studio
        </h2>
  
        <div className="space-y-6 text-zinc-400">
          <p className="hover:text-white cursor-pointer">
            Dashboard
          </p>
  
          <p className="hover:text-white cursor-pointer">
            Templates
          </p>
  
          <p className="hover:text-white cursor-pointer">
            Story Ideas
          </p>
  
          <p className="hover:text-white cursor-pointer">
            Exports
          </p>
  
          <p className="hover:text-white cursor-pointer">
            Settings
          </p>
        </div>
      </div>
    );
  }