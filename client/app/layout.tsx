import type { Metadata } from "next";
import "./globals.css";
import "./design.css";
import "./fonts.css";
import { Providers } from "../components/providers";
export const metadata: Metadata = {
  icons: { icon: "/favicon.svg" },
  title: "StudioSpace — Find your space. Create your story.",
  description:
    "Discover and book creative studios, soundstages and production spaces.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
