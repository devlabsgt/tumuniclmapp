// app/layout.tsx
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Geist } from "next/font/google";
import { EnvVarWarning } from "@/components/env-var-warning";
import HeaderAuth from "@/components/header-auth";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import LogoLink from "@/components/ui/LogoLink";

// 👉 Esto define la metadata del <head>
export const metadata = {
  title: 'Gestión Municipal',
  description: 'Sistema de Gestión Municipal',
  icons: [
    { rel: 'icon', url: '/favicon.ico' },
    { rel: 'shortcut icon', url: '/favicon.ico' },
    { rel: 'apple-touch-icon', url: '/favicon.png' }, // si tiene PNG
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
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <main className="min-h-screen flex flex-col items-center">
            <div className="flex-1 w-full flex flex-col gap-4 items-center">
              <nav className="w-full flex border-b border-b-foreground/10 h-40">

                  <div className="w-full flex items-center justify-between px-5 py-3 text-sm">
                    <div className="flex items-center gap-3">
                      <LogoLink />
                    </div>
                    <div className="shrink-0">
                      {!hasEnvVars ? <EnvVarWarning /> : <HeaderAuth />}
                    </div>
                  </div>


              </nav>

              <div className="flex flex-col gap-5 max-w-5xl p-5">{children}</div>

              <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16 text-xl">
                <p>
                  Powered by{" "}
                  <a
                    href="https://www.oscar27jimenez.com"
                    target="_blank"
                    className="font-bold hover:underline"
                    rel="noreferrer"
                  >
                    Ing. Oscar Jiménez
                  </a>
                </p>
                <ThemeSwitcher />
              </footer>
            </div>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
