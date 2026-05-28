type ExportToastProps = {
  message: string | null;
  variant?: "success" | "error";
};

export default function ExportToast({
  message,
  variant = "success",
}: ExportToastProps) {
  if (!message) return null;

  const isSuccess = variant === "success";

  return (
    <div
      role="status"
      className={`fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-2xl px-6 py-4 text-sm font-semibold shadow-[0_0_40px_rgba(247,198,0,0.25)] backdrop-blur-md transition-all duration-300 ${
        isSuccess
          ? "bg-[#0b0f1a] text-white ring-1 ring-[#f7c600]/50"
          : "bg-red-950 text-red-100 ring-1 ring-red-500/40"
      }`}
    >
      <span
        className={`mr-2 inline-block h-2 w-2 rounded-full ${
          isSuccess ? "bg-[#f7c600]" : "bg-red-400"
        }`}
      />
      {message}
    </div>
  );
}
