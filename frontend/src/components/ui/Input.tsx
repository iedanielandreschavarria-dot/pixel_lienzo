import { type InputHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className, id, ...props }, ref) => {
  const inputId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-marfil-suave">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={clsx(
          "rounded-lg border bg-antracita px-4 py-2.5 text-sm text-marfil placeholder:text-marfil-suave/50 focus:outline-none focus:ring-1 focus:ring-ocre/60",
          error ? "border-terracota" : "border-antracita-suave focus:border-ocre/60",
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-terracota">{error}</span>}
    </div>
  );
});
Input.displayName = "Input";
