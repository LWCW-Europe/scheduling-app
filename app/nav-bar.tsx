"use client";
import { Disclosure } from "@headlessui/react";
import {
  AcademicCapIcon,
  Bars3Icon,
  BeakerIcon,
  BoltIcon,
  BookOpenIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  CakeIcon,
  CalendarIcon,
  ChatBubbleLeftIcon,
  CloudIcon,
  CodeBracketIcon,
  CogIcon,
  CommandLineIcon,
  ComputerDesktopIcon,
  CpuChipIcon,
  FireIcon,
  GlobeAltIcon,
  HeartIcon,
  HomeIcon,
  MicrophoneIcon,
  MusicalNoteIcon,
  PaintBrushIcon,
  RocketLaunchIcon,
  SparklesIcon,
  StarIcon,
  SunIcon,
  TrophyIcon,
  UserGroupIcon,
  WrenchIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ExportScheduleModal, MapModal } from "./modals";
import { LogoutButton } from "./logout-button";
import { useEffect, useState } from "react";
import { ForwardRefExoticComponent, RefAttributes, SVGProps } from "react";

type HeroIcon = ForwardRefExoticComponent<
  Omit<SVGProps<SVGSVGElement>, "ref"> & {
    title?: string;
    titleId?: string;
  } & RefAttributes<SVGSVGElement>
>;

const ICON_MAP: Record<string, HeroIcon> = {
  AcademicCapIcon,
  BeakerIcon,
  BoltIcon,
  BookOpenIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  CakeIcon,
  CalendarIcon,
  ChatBubbleLeftIcon,
  CloudIcon,
  CodeBracketIcon,
  CogIcon,
  CommandLineIcon,
  ComputerDesktopIcon,
  CpuChipIcon,
  FireIcon,
  GlobeAltIcon,
  HeartIcon,
  HomeIcon,
  MicrophoneIcon,
  MusicalNoteIcon,
  PaintBrushIcon,
  RocketLaunchIcon,
  SparklesIcon,
  StarIcon,
  SunIcon,
  TrophyIcon,
  UserGroupIcon,
  WrenchIcon,
};

export type NavItem = {
  name: string;
  href: string;
  icon: string | null;
};

export default function NavBar({ navItems }: { navItems: NavItem[] }) {
  const [showLogout, setShowLogout] = useState(false);
  const pathname = usePathname();

  const checkAuth = () => {
    const hasAuthCookie = document.cookie.includes("site-auth=authenticated");
    setShowLogout(hasAuthCookie);
  };

  useEffect(() => {
    // checkAuth reads document.cookie, a browser-only API; must run
    // post-mount to avoid hydration mismatch. Re-check on pathname change
    // to catch login/logout redirects.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkAuth();
  }, [pathname]);

  useEffect(() => {
    const handleAuthChange = () => checkAuth();

    window.addEventListener("authStateChanged", handleAuthChange);
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
                      {navItems.map((item) => (
                        <NavBarItem key={item.name} item={item} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapModal />
                  <ExportScheduleModal />
                  {showLogout && <LogoutButton />}
                </div>
              </div>
            </div>
          </div>
          <Disclosure.Panel className="sm:hidden">
            <div className="space-y-1 px-2 pb-3 pt-2">
              {navItems.map((item) => (
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
  const Icon = item.icon ? ICON_MAP[item.icon] : null;
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
      {Icon && <Icon className="block h-5 w-auto" />}
      {item.name}
    </Link>
  );
}

function SmallNavBarItem(props: { item: NavItem }) {
  const { item } = props;
  const isCurrentPage = usePathname().includes(item.href) && item.href != null;
  const Icon = item.icon ? ICON_MAP[item.icon] : null;
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
      {Icon && <Icon className="block h-5 w-auto" />}
      {item.name}
    </Disclosure.Button>
  );
}
