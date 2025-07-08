import "./globals.css";
import { Geist } from "next/font/google";
import HeaderAuth from "@/components/header-auth";
import LogoLink from "@/components/ui/LogoLink";
import AutoLogoutWrapper from '@/components/ui/AutoLogoutWrapper';
import FechaHoraActual from '@/components/ui/FechaHoraActual';

export const metadata = {
  title: "Gestión Municipal",
  description: "Sistema de Gestión Municipal",
  icons: [
    { rel: "icon", url: "/favicon.ico" },
    { rel: "shortcut icon", url: "/favicon.ico" },
    { rel: "apple-touch-icon", url: "/favicon.png" },
  ],
};

const geistSans = Geist({ display: "swap", subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground min-h-screen flex flex-col">
        <AutoLogoutWrapper />

        <div className="flex flex-col flex-1">
          {/* Header */}
          <nav className="w-full flex border-b border-b-foreground/10 h-40">
            <div className="w-full flex bg-gray-100 items-center justify-between px-5 py-3 text-sm">
              <div className="flex items-center gap-3">
                <LogoLink />
              </div>
              <div className="shrink-0">
                <HeaderAuth />
              </div>
            </div>
          </nav>

          {/* Contenido principal */}
          <main className="flex flex-col gap-5 max-w-5xl p-5 flex-grow w-full self-center">
            {children}
          </main>

          {/* Footer fijo al fondo sin espacio blanco */}
          <footer className="pt-5 mt-auto border-t border-foreground/10 bg-gray-100 dark:bg-neutral-900 text-gray-700 dark:text-gray-300 px-6 pb-6">
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
                <p className="text-[10px] md:text-xs mt-1">Versión 1.0.0</p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
