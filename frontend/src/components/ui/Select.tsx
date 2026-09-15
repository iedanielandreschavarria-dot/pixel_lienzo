import { type SelectHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, id, children, ...props }, ref) => {
    const selectId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-marfil-suave">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={clsx(
            "rounded-lg border bg-antracita px-4 py-2.5 text-sm text-marfil focus:outline-none focus:ring-1 focus:ring-ocre/60",
            error ? "border-terracota" : "border-antracita-suave focus:border-ocre/60",
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && <span className="text-xs text-terracota">{error}</span>}
      </div>
    );
  }
);
Select.displayName = "Select";
