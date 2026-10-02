import { notFound } from "next/navigation";
import { connection } from "next/server";
import { SiteHeader } from "@/components/SiteHeader";
import { isAdmin } from "@/lib/dashboard";

/**
 * Checked here rather than in the page, so it runs before the loading view
 * streams and everyone else gets a real 404.
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await connection();
  if (!(await isAdmin())) notFound();
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        {children}
      </main>
    </>
  );
}
