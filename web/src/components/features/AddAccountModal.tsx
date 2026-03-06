import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useToastStore } from "@/stores/toastStore";
import { Modal } from "@/components/ui/Modal";

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddAccountModal({ isOpen, onClose }: AddAccountModalProps) {
  const { addAccount } = useAuthStore();
  const { success, error: showError } = useToastStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setEmail("");
    setPassword("");
    setError(null);
    setIsSubmitting(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Email and password are required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await addAccount(trimmedEmail, password);
      success("Account added to this device");
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add account";
      setError(message);
      showError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal title="Add Account" onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        <p className="text-sm text-dark-text-muted">
          Sign in with another account to make switching faster on this device.
        </p>

        <div>
          <label htmlFor="add-account-email" className="mb-1 block text-sm font-medium text-dark-text">
            Email
          </label>
          <input
            id="add-account-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-dark-text placeholder-dark-text-muted focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>

        <div>
          <label
            htmlFor="add-account-password"
            className="mb-1 block text-sm font-medium text-dark-text"
          >
            Password
          </label>
          <input
            id="add-account-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-dark-text placeholder-dark-text-muted focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-dark-bg px-4 py-2 text-dark-text transition-colors hover:bg-dark-border"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Adding..." : "Add Account"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
