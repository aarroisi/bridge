import { Copy } from "lucide-react";
import { clsx } from "clsx";
import { useToastStore } from "@/stores/toastStore";

interface CopyLinkButtonProps {
  url: string;
  label: string;
  successMessage: string;
  errorMessage: string;
  className?: string;
  iconSize?: number;
}

export function CopyLinkButton({
  url,
  label,
  successMessage,
  errorMessage,
  className,
  iconSize = 18,
}: CopyLinkButtonProps) {
  const { success, error } = useToastStore();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      success(successMessage);
    } catch {
      error(errorMessage);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      aria-label={label}
      title={label}
      className={clsx(
        "text-dark-text-muted hover:text-blue-400 transition-colors p-1 hover:bg-dark-surface rounded",
        className,
      )}
    >
      <Copy size={iconSize} />
    </button>
  );
}
