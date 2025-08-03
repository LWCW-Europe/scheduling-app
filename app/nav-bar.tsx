"use client";
import { Disclosure } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { CONSTS, NavItem } from "@/utils/constants";
import { LogoutButton } from "./logout-button";
import { useEffect, useState } from "react";

export default function Example() {
  const [showLogout, setShowLogout] = useState(false);
  const pathname = usePathname();

  const checkAuth = () => {
    // Check if password protection is enabled and user is authenticated
    const hasAuthCookie = document.cookie.includes("site-auth=authenticated");
    setShowLogout(hasAuthCookie);
  };

  useEffect(() => {
    checkAuth();
  }, [pathname]); // Re-check when pathname changes (like after login redirect)

  // Listen for custom auth events (triggered by login/logout actions)
  useEffect(() => {
    const handleAuthChange = () => checkAuth();

    // Listen for custom events
    window.addEventListener("authStateChanged", handleAuthChange);

    // Also listen for focus (when user returns to tab)
    window.addEventListener("focus", handleAuthChange);

    return () => {
      window.removeEventListener("authStateChanged", handleAuthChange);
      window.removeEventListener("focus", handleAuthChange);
    };
  }, []);

  return (
    <Disclosure
      as="nav"
      className="bg-white border-b border-gray-300 fixed w-full z-30"
    >
      {({ open }) => (
        <>
          <div className="mx-auto px-2 sm:px-6 lg:px-8">
            <div className="relative flex h-16 items-center justify-between">
              <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                {/* Mobile menu button*/}
                <Disclosure.Button className="relative inline-flex items-center justify-center rounded-md p-2 text-rose-400 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-rose-400">
                  <span className="absolute -inset-0.5" />
                  {open ? (
                    <XMarkIcon className="block h-6 w-6 stroke-2" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6 stroke-2" />
                  )}
                </Disclosure.Button>
              </div>
              <div className="flex justify-between w-full items-center">
                <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                  {/* Desktop nav */}
                  <div className="hidden sm:block">
                    <div className="flex space-x-4">
                      {CONSTS.NAV_ITEMS.map((item) => (
                        <NavBarItem key={item.name} item={item} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {showLogout && <LogoutButton />}
                </div>
              </div>
            </div>
          </div>
          <Disclosure.Panel className="sm:hidden">
            <div className="space-y-1 px-2 pb-3 pt-2">
              {CONSTS.NAV_ITEMS.map((item) => (
                <SmallNavBarItem key={item.name} item={item} />
              ))}
              {showLogout && (
                <div className="px-1 pt-2 border-t border-gray-200">
                  <LogoutButton className="w-full justify-start" />
                </div>
              )}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}

function NavBarItem(props: { item: NavItem }) {
  const { item } = props;
  const isCurrentPage = usePathname().includes(item.href) && item.href != null;
  return (
    <Link
      key={item.name}
      href={item.href}
      className={clsx(
        isCurrentPage
          ? "bg-rose-50 text-rose-400"
          : "text-gray-400 hover:bg-gray-100",
        "group flex gap-1 cursor-pointer items-center rounded-md px-3 py-2 text-sm font-medium"
      )}
    >
      <item.icon className="block h-5 w-auto" />
      {item.name}
    </Link>
  );
}

function SmallNavBarItem(props: { item: NavItem }) {
  const { item } = props;
  const isCurrentPage = usePathname().includes(item.href) && item.href != null;
  return (
    <Disclosure.Button
      key={item.name}
      as="a"
      href={item.href}
      className={clsx(
        isCurrentPage
          ? "bg-rose-50 text-rose-400"
          : "text-gray-400 hover:bg-gray-100",
        "flex gap-2 rounded-md px-3 py-2 text-base font-medium"
      )}
    >
      <item.icon className="block h-5 w-auto" />
      {item.name}
    </Disclosure.Button>
  );
}
