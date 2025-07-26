"use client";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import clsx from "clsx";

export function EventSelect(props: { eventNames: string[] }) {
  const { eventNames } = props;
  const searchParams = useSearchParams();
  const urlSearchParams = new URLSearchParams(searchParams);
  const pathname = usePathname();
  const router = useRouter();
  return (
    <div className="flex gap-10 w-full items-center">
      {eventNames.map((name) => (
        <button
          key={name}
          onClick={() => {
            urlSearchParams.set("event", name);
            router.replace(`${pathname}?${urlSearchParams.toString()}`);
          }}
          className={clsx(
            urlSearchParams.get("event") === name
              ? "bg-rose-100 text-rose-700"
              : "text-gray-500 hover:text-gray-700",
            "rounded-md px-3 py-2 text-sm font-medium"
          )}
        >
          {name}
        </button>
      ))}
    </div>
  );
}
