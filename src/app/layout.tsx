import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Geist_Mono, Outfit } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { ActiveOrderBanner } from "@/components/home/ActiveOrderBanner";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from 'sonner';
import { cookies } from 'next/headers';

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const spaceCowgirl = localFont({
  src: [
    { path: "../fonts/space-cowgirl/SpaceCowgirl-Light.woff2", weight: "300", style: "normal" },
    { path: "../fonts/space-cowgirl/SpaceCowgirl-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/space-cowgirl/SpaceCowgirl-Medium.woff2", weight: "500", style: "normal" },
    { path: "../fonts/space-cowgirl/SpaceCowgirl-Bold.woff2", weight: "700", style: "normal" },
    { path: "../fonts/space-cowgirl/SpaceCowgirl-Black.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-brand",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Snaxy — Fuel Your Day | Instant Campus Bites",
  description: "Order fresh snacks, meals, and beverages with instant 1-tap UPI QR payments. Zero waiting, straight to your spot.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon",
    apple: "/apple-icon",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Snaxy",
  },
};

export const viewport: Viewport = {
  themeColor: "#08090f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const isLoggedIn = !!cookieStore.get('snaxy_user_session')?.value;

  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${outfit.variable} ${spaceCowgirl.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-primary/30 selection:text-white font-sans">
        <AuthProvider>
          <Navbar isLoggedIn={isLoggedIn} />
          <div className="flex-1 flex flex-col">
            {children}
          </div>
          <ActiveOrderBanner />
          <Footer />
          <ServiceWorkerRegister />
        </AuthProvider>
        <Toaster
          theme="dark"
          position="bottom-center"
          toastOptions={{
            style: {
              background: 'rgba(12, 14, 22, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 85, 0, 0.25)',
              color: '#f8fafc',
              borderRadius: '18px',
              boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.8)',
            },
          }}
        />
      </body>
    </html>
  );
}
