import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Separator } from "@/components/ui/separator";
import { Analytics } from "@vercel/analytics/next";
import { SITE_DESCRIPTION } from "@/lib/site";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const description = SITE_DESCRIPTION;

export const metadata: Metadata = {
  title: "Quairy",
  description,
  // Relative URLs resolve against the deployment's URL on Vercel.
  openGraph: { siteName: "Quairy", title: "Quairy", description, images: "/card" },
  twitter: { card: "summary_large_image", title: "Quairy", description, images: "/card" },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafcfd" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1013" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${instrumentSans.variable} ${bricolage.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <ClerkProvider appearance={{ theme: shadcn }}>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        {children}
        <footer className="flex flex-col" style={{ viewTransitionName: "site-footer" }}>
          <Separator />
          <p className="px-4 py-4 text-center text-xs text-muted-foreground">
            Answers powered by Jev, a System One model from{" "}
            <a href="https://typesafe.ai" className="underline-offset-4 hover:underline">
              TypeSafe
            </a>
          </p>
        </footer>
        <Analytics />
        {/* Real-user Core Web Vitals, reported to Vercel Speed Insights. */}
        <SpeedInsights />
        </ClerkProvider>
      </body>
    </html>
  );
}
