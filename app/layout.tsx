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
            <div className="flex-1 w-full flex flex-col gap-20 items-center">
              <nav className="w-full flex border-b border-b-foreground/10 h-24">
                <div className="w-full max-w-5xl mx-auto flex items-center p-3 px-5 text-sm">
                  <div className="flex gap-5 items-center font-semibold">
                    <LogoLink />
                  </div>
                  <div className="flex-1" />
                  <div>
                    {!hasEnvVars ? <EnvVarWarning /> : <HeaderAuth />}
                  </div>
                </div>
              </nav>

              <div className="flex flex-col gap-20 max-w-5xl p-5">{children}</div>

              <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
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
