import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = { title: "Create your account – Quairy" };

// Quairy's own sign-up page, in the Quarry theme, instead of Clerk's hosted one.
export default function SignUpPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex flex-1 justify-center px-4 py-12">
        <SignUp />
      </main>
    </>
  );
}
