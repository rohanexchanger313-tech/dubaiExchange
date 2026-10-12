import type { Metadata, Viewport } from "next";
import "../styles.css";

export const metadata: Metadata = {
  title: "Riyal — A clearer way to request a USDT quote",
  description:
    "Choose a Saudi payment method and request a USDT-to-SAR quote. Verify every detail with your provider before sending funds.",
};

export const viewport: Viewport = {
  themeColor: "#0c3028",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
