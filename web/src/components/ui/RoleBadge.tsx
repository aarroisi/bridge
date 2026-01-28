import { clsx } from "clsx";
import { Role } from "@/types";

interface RoleBadgeProps {
  role: Role;
  className?: string;
}

const roleConfig: Record<Role, { label: string; className: string }> = {
  owner: {
    label: "Owner",
    className: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
  member: {
    label: "Member",
    className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  guest: {
    label: "Guest",
    className: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  },
};

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = roleConfig[role];

  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
