import { CakeIcon, UserGroupIcon } from "@heroicons/react/24/outline";
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
  TITLE: "Example Conference Weekend",
  DESCRIPTION:
    "An Example Conference is happening from August 23 - 25, 2024 at Lighthaven. Check out the schedules for the main event and afterparty below!",
  MULTIPLE_EVENTS: true,
  // If you have multiple events, add your events to the nav bar below
  // If you only have one event, you can leave the array empty
  // Find available icons at https://heroicons.com/
  NAV_ITEMS: [
    { name: "Conference", href: "/Conference", icon: UserGroupIcon },
    { name: "After Party", href: "/After-Party", icon: CakeIcon },
  ] as NavItem[],
};
