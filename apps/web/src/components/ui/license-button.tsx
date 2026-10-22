import * as React from "react";

type LicenseButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode };

/** The one cyan element on any screen (design lock: primary conversion uses cyan). */
export function LicenseButton({ className = "", children = "License", ...props }: LicenseButtonProps) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center rounded-md",
        "bg-echo-cyan px-4 py-2 text-sm font-semibold text-black",
        "transition hover:brightness-110",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-echo-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-echo-dark",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
