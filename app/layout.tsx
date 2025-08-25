import "./globals.css";
import { Geist } from "next/font/google";
import HeaderAuth from "@/components/header-auth";
import LogoLink from "@/components/ui/LogoLink";
import FechaHoraActual from '@/components/ui/FechaHoraActual';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";

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
  const isAuthPage = pathname === "/sign-in";

  return (
    <html lang="es" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">

        {isAuthPage ? (
          <>
            {children}
          </>
        ) : (
          <div className="min-h-screen flex flex-col">
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

            <main className="flex flex-col gap-5 p-4 flex-grow w-full max-w-7xl mx-auto">
              {children}
            </main>

            <footer className="pt-5 border-t border-foreground/10 bg-gray-100 dark:bg-neutral-900 text-gray-700 dark:text-gray-300 px-6 pb-6">
              <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
                <div className="text-left">
                  <FechaHoraActual />
                  <p className="mt-2 text-sm md:text-base">
                    Powered by{" "}
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
                <div className="text-right text-xs md:text-sm leading-tight">
                  <p>© {new Date().getFullYear()} - Todos los derechos reservados.</p>
                  <p className="text-[10px] md:text-xs mt-1">Versión 1.4.7</p>
                </div>
              </div>
            </footer>
          </div>
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
      </body>
    </html>
  );
}