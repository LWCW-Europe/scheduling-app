import { ReactNode } from "react";

export default function HoverTooltip(props: {
  children: ReactNode;
  text: string;
  visible: boolean;
}) {
  const { children, text, visible } = props;
  return (
    <div className="relative inline-block group">
      {children}
      {visible && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-sm text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
          {text}
        </div>
      )}
    </div>
  );
}
