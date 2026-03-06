import { useState } from "react";
import { Code2, LogOut, User, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useToastStore } from "@/stores/toastStore";
import { Avatar } from "@/components/ui/Avatar";
import { Dropdown, DropdownDivider, DropdownItem } from "@/components/ui/Dropdown";
import { DevelopersModal } from "./DevelopersModal";
import { ProfileModal } from "./ProfileModal";
import { AddAccountModal } from "./AddAccountModal";

export function ProfileMenu() {
  const navigate = useNavigate();
  const { user, accounts, logout, switchAccount } = useAuthStore();
  const { success, error: showError } = useToastStore();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isDevelopersModalOpen, setIsDevelopersModalOpen] = useState(false);
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [switchingAccountId, setSwitchingAccountId] = useState<string | null>(null);

  if (!user) return null;

  const otherAccounts = accounts.filter((account) => account.user.id !== user.id);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleSwitchAccount = async (userId: string) => {
    setSwitchingAccountId(userId);

    try {
      await switchAccount(userId);
      success("Account switched");
      navigate("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to switch account";
      showError(message);
    } finally {
      setSwitchingAccountId(null);
    }
  };

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

        {otherAccounts.length > 0 && (
          <div className="border-b border-dark-border px-3 py-2">
            <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-dark-text-muted">
              Switch account
            </p>
            <div className="mt-2 space-y-1">
              {otherAccounts.map((account) => {
                const isSwitching = switchingAccountId === account.user.id;

                return (
                  <button
                    key={account.user.id}
                    type="button"
                    onClick={() => void handleSwitchAccount(account.user.id)}
                    disabled={switchingAccountId !== null}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-dark-text transition-colors hover:bg-dark-border disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Avatar name={account.user.name} src={account.user.avatar} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{account.user.name}</p>
                      <p className="truncate text-xs text-dark-text-muted">{account.user.email}</p>
                    </div>
                    {isSwitching && <span className="text-xs text-dark-text-muted">Switching...</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="pt-1">
          <DropdownItem onClick={() => setIsProfileModalOpen(true)}>
            <div className="flex items-center gap-2">
              <User size={16} />
              <span>Edit Profile</span>
            </div>
          </DropdownItem>
          <DropdownItem onClick={() => setIsAddAccountModalOpen(true)}>
            <div className="flex items-center gap-2">
              <UserPlus size={16} />
              <span>Add account</span>
            </div>
          </DropdownItem>
          <DropdownItem onClick={() => setIsDevelopersModalOpen(true)}>
            <div className="flex items-center gap-2">
              <Code2 size={16} />
              <span>Developers</span>
            </div>
          </DropdownItem>
          <DropdownDivider />
          <DropdownItem onClick={() => void handleLogout()} variant="danger">
            <div className="flex items-center gap-2">
              <LogOut size={16} />
              <span>Log out</span>
            </div>
          </DropdownItem>
        </div>
      </Dropdown>

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
      <DevelopersModal
        isOpen={isDevelopersModalOpen}
        onClose={() => setIsDevelopersModalOpen(false)}
      />
      <AddAccountModal
        isOpen={isAddAccountModalOpen}
        onClose={() => setIsAddAccountModalOpen(false)}
      />
    </>
  );
}
