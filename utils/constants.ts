import {
  BuildingLibraryIcon,
  FilmIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { ForwardRefExoticComponent, RefAttributes, SVGProps } from "react";

export type NavItem = {
  name: string;
  href: string;
  icon: ForwardRefExoticComponent<
    Omit<SVGProps<SVGSVGElement>, "ref"> & {
      title?: string;
      titleId?: string;
    } & RefAttributes<SVGSVGElement>
  >;
};

export const CONSTS = {
  TITLE: "LWCW 2025",
  DESCRIPTION: "LessWrong Community Weekend in Berlin, Germany.",
  MULTIPLE_EVENTS: true,
  // If you have multiple events, add your events to the nav bar below
  // If you only have one event, you can leave the array empty
  // Find available icons at https://heroicons.com/
  NAV_ITEMS: [
    { name: "Pre LWCW", href: "/Pre-LWCW", icon: FilmIcon },
    { name: "LWCW 2025", href: "/LWCW-2025", icon: UserGroupIcon },
    { name: "Post LWCW", href: "/Post-LWCW", icon: BuildingLibraryIcon },
  ] as NavItem[],
};
