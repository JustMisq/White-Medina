import { AppSidebar } from "@/components/layout/app-sidebar";

export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto bg-muted/30 p-6 pt-16 md:pt-6">
        {children}
      </main>
    </div>
  );
}
