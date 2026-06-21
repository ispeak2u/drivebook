import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "DriveBook",
  description: "Driving instructor booking marketplace MVP shell"
};

const navItems = [
  { href: "/search", label: "Search" },
  { href: "/booking", label: "Booking" },
  { href: "/student/dashboard", label: "Student" },
  { href: "/instructor/dashboard", label: "Instructor" },
  { href: "/instructor/profile", label: "Profile" },
  { href: "/reviews", label: "Reviews" },
  { href: "/admin/reviews", label: "Admin" }
];

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <header className="topbar">
            <div className="topbar-inner">
              <Link className="brand" href="/">
                <span className="brand-mark">D</span>
                <span>DriveBook</span>
              </Link>
              <nav className="nav" aria-label="Main navigation">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
