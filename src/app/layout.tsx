import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wisdom House Education System | Karachi (Montessori to Matric BSEK)",
  description: "Official web portal of Wisdom House Education System, Karachi. Affiliated with BSEK Karachi Board, 4 Campuses, 99% Board Pass Rate, and Admissions Open 2026-2027.",
  keywords: "Wisdom House Education System, Karachi school, BSEK Karachi, Matric Science, Montessori admission Karachi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
