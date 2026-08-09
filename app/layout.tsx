import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Sessions — Tutoring Portal",
  description: "View and reschedule your upcoming tutoring sessions",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
