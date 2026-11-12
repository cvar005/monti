import Tabs from "@/components/Tabs";
import InstallNudge from "@/components/InstallNudge";
import { requireProfile } from "@/lib/data";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { profile } = await requireProfile();
  return (
    <div className="shell">
      <main className="page">
        <InstallNudge />
        {children}
      </main>
      <Tabs guest={profile.plan === "guest"} />
    </div>
  );
}
