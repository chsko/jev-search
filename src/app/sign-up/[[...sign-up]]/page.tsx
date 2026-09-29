import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import { AuthPage } from "@/components/AuthPage";

export const metadata: Metadata = { title: "Create your account – Quairy" };

/** Prebuilt: the page is the same for everyone. Clerk's later steps render on demand. */
export function generateStaticParams() {
  return [{ "sign-up": [] }];
}

// Quairy's own sign-up page, in the Quarry theme, instead of Clerk's hosted one.
export default function SignUpPage() {
  return (
    <AuthPage label="Loading sign up…" prefetch="/sign-in">
      <SignUp />
    </AuthPage>
  );
}
