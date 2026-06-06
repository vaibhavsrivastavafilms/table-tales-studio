import OsMobileHeader from "@/components/os/OsMobileHeader";
import OsSidebar from "@/components/os/OsSidebar";
import OsTopBar from "@/components/os/OsTopBar";

type OsShellProps = {
  title: string;
  description?: string;
  userEmail?: string | null;
  showBranchSelector?: boolean;
  children: React.ReactNode;
};

export default function OsShell({
  title,
  description,
  userEmail,
  showBranchSelector = false,
  children,
}: OsShellProps) {
  return (
    <div className="flex min-h-[100dvh] w-full bg-[var(--os-bg)]">
      <div className="hidden lg:flex lg:shrink-0">
        <OsSidebar />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <OsMobileHeader
          title={title}
          userEmail={userEmail}
          showBranchSelector={showBranchSelector}
        />
        <OsTopBar
          title={title}
          description={description}
          userEmail={userEmail}
          showBranchSelector={showBranchSelector}
        />
        <main className="flex-1 overflow-y-auto os-scroll p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
