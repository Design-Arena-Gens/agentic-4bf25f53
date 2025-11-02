export const metadata = {
  title: "LLM Eval Dashboard",
  description: "Evaluate LLM responses against references"
};

import "./globals.css";
import React from "react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <header className="header">
            <div className="brand">LLM Eval Dashboard</div>
            <nav className="nav">
              <a href="/" className="nav-link">Dashboard</a>
            </nav>
          </header>
          <main className="main">{children}</main>
          <footer className="footer">Built for quick, offline evaluation</footer>
        </div>
      </body>
    </html>
  );
}
