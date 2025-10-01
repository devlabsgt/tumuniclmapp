// app/layout.tsx
import "./globals.css";
import { Geist } from "next/font/google";
import HeaderAuth from "@/components/header-auth";
import LogoLink from "@/components/ui/LogoLink";
import FechaHoraActual from '@/components/ui/FechaHoraActual';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";

export const metadata: Metadata = {
  title: "Gestión Municipal",
  description: "Sistema de Gestión Municipal",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192x192.png",
    shortcut: "/icon-192x192.png",
    apple: "/icon-192x192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
};

const geistSans = Geist({ display: "swap", subsets: ["latin"] });

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = (await headers()).get("x-pathname") || "";
  const isAuthPage = pathname === "/";

  return (
    <html lang="es" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <div className="flex flex-col min-h-screen">
          {isAuthPage ? (
            <>
              {children}
            </>
          ) : (
            <>
              <nav className="w-full flex border-b border-b-foreground/10 h-40">
                <div className="w-full flex bg-gray-100 items-center justify-between px-1 pt-1 pb-0 text-sm">
                  <div className="flex items-center gap-3">
                    <LogoLink />
                  </div>
                  <div className="shrink-0">
                    <HeaderAuth />
                  </div>
                </div>
              </nav>

              <main className="flex flex-col gap-5 pt-2 flex-grow w-full mx-auto">
                {children}
              </main>
            <footer className="mt-5 pt-5 pb-20 border-t border-foreground/10 bg-gray-100 dark:bg-neutral-900 text-gray-700 dark:text-gray-300 px-6 shrink-0">
            <div className="max-w-6xl mx-auto flex flex-row justify-between gap-0">
              <div className="w-1/2 text-left">
                <FechaHoraActual />
                <p className="mt-5 text-xs md:text-base">
                  Powered by{" "}<br/>
                  <a
                    href="https://www.oscar27jimenez.com"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold hover:underline text-[#06c]"
                  >
                    Ing. Oscar Jiménez
                  </a>
                </p>
              </div>
              <div className="w-1/2 text-end text-xs md:text-sm leading-tight ">
                <p>© {new Date().getFullYear()} - Todos los derechos reservados.</p>
                <p className="mt-10 text-[10px] md:text-xs text-[#06C] font-bold">Versión 1.4.7</p>
              </div>
            </div>
          </footer>
            </>
          )}

          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
          <script src="https://cdn.lordicon.com/lordicon.js"></script>
        </div>
        <div className="fixed bottom-0 w-full z-10">
          <ProgressiveBlur
            height="100px"
            position="bottom"
            className="w-full"
          />
        </div>
      </body>
    </html>
  );
}