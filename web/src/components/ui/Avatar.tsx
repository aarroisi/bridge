import { clsx } from "clsx";

interface AvatarProps {
  name: string;
  size?: "xs" | "sm" | "md" | "lg";
  online?: boolean;
  className?: string;
}

const sizeClasses = {
  xs: "w-5 h-5 text-xs",
  sm: "w-6 h-6 text-xs",
  md: "w-8 h-8 text-sm",
  lg: "w-10 h-10 text-base",
};

const colors = [
  "bg-blue-600",
  "bg-green-600",
  "bg-purple-600",
  "bg-pink-600",
  "bg-orange-600",
  "bg-teal-600",
];

function getColorForName(name: string): string {
  if (!name) return colors[0];
  const hash = name
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

function getInitials(name: string): string {
  if (!name) return "??";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function Avatar({ name, size = "md", online, className }: AvatarProps) {
  const safeName = name || "Unknown User";
  const colorClass = getColorForName(safeName);
  const initials = getInitials(safeName);

  return (
    <div className={clsx("relative flex-shrink-0", className)}>
      <div
        className={clsx(
          "rounded-full flex items-center justify-center font-medium text-white",
          sizeClasses[size],
          colorClass,
        )}
      >
        {initials}
      </div>
      {online !== undefined && (
        <div
          className={clsx(
            "absolute bottom-0 right-0 rounded-full border-2 border-dark-surface",
            size === "xs" ? "w-1.5 h-1.5" : "w-2 h-2",
            online ? "bg-green-500" : "bg-gray-500",
          )}
        />
      )}
    </div>
  );
}
