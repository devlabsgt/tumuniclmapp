// app/layout.tsx
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Geist } from "next/font/google";
import HeaderAuth from "@/components/header-auth";
import { ThemeSwitcher } from "@/components/theme-switcher";
import LogoLink from "@/components/ui/LogoLink";
import AutoLogoutWrapper from '@/components/ui/AutoLogoutWrapper';

// 👉 Esto define la metadata del <head>
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
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
            <AutoLogoutWrapper />  {/* 👈 Aquí activa el cierre automático */}

          {/* Layout principal en columna */}
          <main className="min-h-screen flex flex-col">
            {/* Encabezado y contenido principal */}
            <div className="flex-1 flex flex-col items-center">
              <nav className="w-full flex border-b border-b-foreground/10 h-40">
                <div className="w-full flex items-center justify-between px-5 py-3 text-sm">
                  <div className="flex items-center gap-3">
                    <LogoLink />
                  </div>
                  <div className="shrink-0">
                    <HeaderAuth />
                  </div>
                </div>
              </nav>

              {/* Contenido con flex-grow para empujar el footer */}
              <div className="flex flex-col gap-5 max-w-5xl p-5 flex-grow w-full">
                {children}
              </div>
            </div>

            {/* Footer fijo al fondo */}

            <footer className="w-full flex items-center justify-between border-t text-xs md:text-lg px-8 py-8 text-black dark:text-white">
              <p className="text-left">
                Powered by{" "} <br/>
                <a
                  href="https://www.oscar27jimenez.com"
                  target="_blank"
                  className="font-bold hover:underline"
                  rel="noreferrer"
                >
                  Ing. Oscar Jiménez
                </a>
              </p>
              <div className="text-right">
                <ThemeSwitcher />
              </div>
            </footer>



          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
