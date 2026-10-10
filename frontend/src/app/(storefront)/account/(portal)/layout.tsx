import { RequireAuth } from "@/components/auth/require-auth";
import { AccountSidebar } from "@/components/account/account-sidebar";

export default function AccountPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <div className="container-page py-6 lg:py-10">
        <div className="flex flex-col lg:flex-row lg:gap-8">
          <AccountSidebar />
          <main className="min-w-0 flex-1 lg:w-[75%]">{children}</main>
        </div>
      </div>
    </RequireAuth>
  );
}
