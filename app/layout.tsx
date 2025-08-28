import type { Metadata } from "next";
import { Montserrat, Roboto } from "next/font/google";
import "./globals.css";
import NavBar from "./nav-bar";
import Footer from "./footer";
import { UserProvider } from "./context";
import clsx from "clsx";
import { CONSTS } from "@/utils/constants";
import { isPasswordProtectionEnabledServer } from "@/utils/auth";
import { LogoutButton } from "./logout-button";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const showLogout = isPasswordProtectionEnabledServer();

  return (
    <html lang="en" className={fontVars}>
      <body className="font-monteserrat flex flex-col min-h-screen">
        <UserProvider>
          {CONSTS.MULTIPLE_EVENTS && <NavBar />}
          {showLogout && !CONSTS.MULTIPLE_EVENTS && (
            <div className="fixed top-4 right-4 z-50">
              <LogoutButton />
            </div>
          )}
          <main
            className={clsx(
              "lg:px-24 p-3 flex-1",
              CONSTS.MULTIPLE_EVENTS ? "py-24 lg:pb-16" : "pt-12 lg:pb-16"
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
