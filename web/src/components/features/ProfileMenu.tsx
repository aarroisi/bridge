import { useState } from "react";
import { User } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { Avatar } from "@/components/ui/Avatar";
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";
import { ProfileModal } from "./ProfileModal";

export function ProfileMenu() {
  const { user } = useAuthStore();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <Dropdown
        trigger={
          <button
            className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-dark-surface transition-colors"
            title={user.name}
          >
            <Avatar name={user.name} src={user.avatar} size="md" online />
          </button>
        }
        position="top"
        align="left"
      >
        <div className="px-4 py-3 border-b border-dark-border">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} src={user.avatar} size="lg" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-dark-text truncate">
                {user.name}
              </p>
              <p className="text-xs text-dark-text-muted truncate">
                {user.email}
              </p>
            </div>
          </div>
        </div>

        <div className="pt-1">
          <DropdownItem onClick={() => setIsProfileModalOpen(true)}>
            <div className="flex items-center gap-2">
              <User size={16} />
              <span>Edit Profile</span>
            </div>
          </DropdownItem>
        </div>
      </Dropdown>

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
}
