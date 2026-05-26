import { Footer } from "./footer";
import { Navbar } from "./navbar";
import { getUserProfile } from "@/lib/auth/session";

export async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await getUserProfile();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <Navbar user={user} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
