import { type TextareaHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const textareaId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-sm font-medium text-marfil-suave">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
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
  }
);
Textarea.displayName = "Textarea";
