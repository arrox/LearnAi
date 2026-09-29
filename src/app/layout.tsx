import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "LearnAI — Tu tutora de inglés",
  description:
    "Aprende inglés con Lexi, una tutora con IA: test de nivel adaptativo (MCER), lecciones a tu medida, conversación con corrección y repaso espaciado.",
};

export const viewport: Viewport = {
  themeColor: "#1cb0a0",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${nunito.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
