/* eslint-disable react/display-name */
import clsx from "clsx";
import { type ComponentPropsWithoutRef, Ref, forwardRef } from "react";

export const Input = forwardRef(
  (
    props: {
      error?: boolean;
      errorMessage?: string;
    } & ComponentPropsWithoutRef<"input">,
    ref: Ref<HTMLInputElement>
  ) => {
    const { error, errorMessage, className, ...rest } = props;
    return (
      <>
        <input
          ref={ref}
          className={clsx(
            "h-12 rounded-md border bg-white px-4 shadow-sm transition-colors invalid:border-red-500 invalid:text-red-900 invalid:placeholder-red-300 focus:outline-none disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500",
            error
              ? "border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500" // matches invalid: styles
              : "border-gray-300 placeholder-gray-400 focus:ring-2 focus:ring-rose-400 focus:outline-0 focus:border-none",
            className
          )}
          {...rest}
        />
        {error && errorMessage && (
          <span className="text-xs text-red-500">{errorMessage}</span>
        )}
      </>
    );
  }
);
