import React from "react";

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function Badge({
  className,
  children,
  variant = "default",
}: {
  className?: string;
  children: React.ReactNode;
  variant?: "default" | "secondary" | "destructive" | "outline";
}) {
  const baseClasses = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";
  
  const variantClasses = {
    default: "bg-violet-600 text-white",
    secondary: "bg-gray-600 text-gray-100",
    destructive: "bg-red-600 text-white",
    outline: "border border-gray-600 text-gray-300"
  };

  return (
    <span className={cn(baseClasses, variantClasses[variant], className)}>
      {children}
    </span>
  );
}


