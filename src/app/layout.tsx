import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jev Search",
  description: "Ask a yes/no, pick-one or rating question and get Jev's answer.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        {children}
        <footer className="border-t border-line px-4 py-3 text-center text-xs text-muted">
          Answers by Jev, a{" "}
          <a href="https://typesafe.ai" className="hover:underline">
            TypeSafe
          </a>{" "}
          System One model.
        </footer>
      </body>
    </html>
  );
}
