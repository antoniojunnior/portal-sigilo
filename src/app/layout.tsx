import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Calistoga, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const calistoga = Calistoga({
  variable: "--font-calistoga",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Portal Sigilo — Canal de Denúncias",
  description:
    "Canal de denúncias seguro, anônimo e confidencial. Protegido pela Lei 14.457/22, NR-1 e LGPD.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      data-theme="auto"
      className={`${plusJakartaSans.variable} ${calistoga.variable} ${jetbrainsMono.variable} h-full`}
    >
      {/* Restore persisted theme before first paint to avoid FOUC */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){var t=localStorage.getItem('theme');if(t==='light'||t==='dark'||t==='auto')document.documentElement.setAttribute('data-theme',t);})()`,
        }}
      />
      <body
        className="min-h-full flex flex-col"
        style={{ fontFamily: "var(--font-jakarta, var(--font-body))" }}
      >
        {children}
      </body>
    </html>
  );
}
