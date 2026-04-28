import type { Metadata } from "next";
import { Montserrat, Roboto } from "next/font/google";
import "./globals.css";
import NavBar from "./nav-bar";
import Footer from "./footer";
import { UserProvider } from "./context";
import clsx from "clsx";
import { CONSTS } from "@/utils/constants";
import { getRepositories } from "@/db/container";
import { eventNameToSlug } from "@/utils/utils";
import { cookies } from "next/headers";
import { isPasswordProtectionEnabledServer } from "@/utils/auth";

const roboto = Roboto({
  subsets: ["latin"],
  variable: "--font-roboto",
  weight: ["100", "300", "400", "500", "700", "900"],
});
const monteserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-monteserrat",
});

const fontVars = [roboto.variable, monteserrat.variable].join(" ");

export const metadata: Metadata = {
  title: CONSTS.TITLE,
  description: CONSTS.DESCRIPTION,
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const passwordProtected = isPasswordProtectionEnabledServer();
  const isAuthenticated =
    !passwordProtected ||
    (await cookies()).get("site-auth")?.value === "authenticated";
  const events = isAuthenticated ? await getRepositories().events.list() : [];
  const multipleEvents = events.length > 1;
  const navItems = events.map((e) => ({
    name: e.name,
    href: `/${eventNameToSlug(e.name)}`,
    icon: e.icon ?? null,
  }));

  return (
    <html lang="en" className={fontVars}>
      <body className="font-monteserrat flex flex-col min-h-screen">
        <UserProvider>
          <NavBar navItems={multipleEvents ? navItems : []} />
          <main
            className={clsx(
              "lg:px-24 p-3 flex-1",
              multipleEvents ? "py-24 lg:pb-16" : "pt-12 lg:pb-16"
            )}
          >
            {children}
          </main>
          <Footer />
        </UserProvider>
      </body>
    </html>
  );
}
