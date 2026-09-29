import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = { title: "Sign in – Quairy" };

// Quairy's own sign-in page, in the Quarry theme, instead of Clerk's hosted one.
export default function SignInPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex flex-1 justify-center px-4 py-12">
        <SignIn />
      </main>
    </>
  );
}
