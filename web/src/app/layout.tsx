import Link from "next/link";
import { Syne, Figtree } from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: {
    default: "Quorum — Congressional disclosures, with context",
    template: "%s · Quorum",
  },
  description:
    "Browse congressional stock disclosures alongside member roles, committees, and nearby Congress activity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${syne.variable} ${figtree.variable}`}>
        <div className="shell">
          <header className="siteHeader">
            <div className="container navInner">
              <Link href="/" className="brand" aria-label="Quorum home">
                <span className="brandMark" aria-hidden />
                Quorum
              </Link>
              <nav className="navLinks" aria-label="Primary">
                <Link href="/">Home</Link>
                <Link href="/trades">Trades</Link>
                <Link href="/members">Members</Link>
              </nav>
            </div>
          </header>
          <main className="main">{children}</main>
          <footer className="siteFooter">
            <div className="container">
              <span>Quorum — Congress trades, with context.</span>
              <span>Trade-set coverage · House & Senate filers in our dataset</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
