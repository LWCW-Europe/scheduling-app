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
  DESCRIPTION:
    "[DEV INSTANCE] Berlin, Germany.",
  MULTIPLE_EVENTS: false,
  // If you have multiple events, add your events to the nav bar below
  // If you only have one event, you can leave the array empty
  // Find available icons at https://heroicons.com/
  NAV_ITEMS: [] as NavItem[],
};
