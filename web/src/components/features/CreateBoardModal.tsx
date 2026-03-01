import { useState, useEffect, useRef, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";
import { useBoardStore } from "@/stores/boardStore";
import { Check, X, Loader2 } from "lucide-react";

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, prefix: string) => void;
}

export function CreateBoardModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateBoardModalProps) {
  const [name, setName] = useState("");
  const [prefix, setPrefix] = useState("");
  const [prefixTouched, setPrefixTouched] = useState(false);
  const [prefixAvailable, setPrefixAvailable] = useState<boolean | null>(null);
  const [checkingPrefix, setCheckingPrefix] = useState(false);
  const [loading, setLoading] = useState(false);
  const { suggestPrefix, checkPrefix } = useBoardStore();
  const checkTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setName("");
      setPrefix("");
      setPrefixTouched(false);
      setPrefixAvailable(null);
      setCheckingPrefix(false);
      setLoading(false);
    }
  }, [isOpen]);

  const checkPrefixAvailability = useCallback(
    async (value: string) => {
      if (value.length < 2) {
        setPrefixAvailable(null);
        setCheckingPrefix(false);
        return;
      }
      setCheckingPrefix(true);
      try {
        const available = await checkPrefix(value);
        setPrefixAvailable(available);
      } catch {
        setPrefixAvailable(null);
      } finally {
        setCheckingPrefix(false);
      }
    },
    [checkPrefix],
  );

  // Auto-suggest prefix when name changes (only if user hasn't manually edited prefix)
  useEffect(() => {
    if (!prefixTouched && name.trim().length >= 2) {
      const timeout = setTimeout(async () => {
        try {
          const suggested = await suggestPrefix(name.trim());
          setPrefix(suggested);
          checkPrefixAvailability(suggested);
        } catch {
          // ignore
        }
      }, 300);
      return () => clearTimeout(timeout);
    }
    if (!prefixTouched && name.trim().length < 2) {
      setPrefix("");
      setPrefixAvailable(null);
    }
  }, [name, prefixTouched, suggestPrefix, checkPrefixAvailability]);

  const handlePrefixChange = (value: string) => {
    const upper = value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5);
    setPrefix(upper);
    setPrefixTouched(true);
    setPrefixAvailable(null);

    if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
    checkTimeoutRef.current = setTimeout(() => {
      checkPrefixAvailability(upper);
    }, 300);
  };

  const isValidPrefix = /^[A-Z]{2,5}$/.test(prefix);
  const canSubmit =
    name.trim() && isValidPrefix && prefixAvailable === true && !loading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    onSubmit(name.trim(), prefix);
  };

  if (!isOpen) return null;

  return (
    <Modal title="Create Board" onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label
            htmlFor="board-name"
            className="block text-sm font-medium text-dark-text mb-1"
          >
            Name <span className="text-red-400">*</span>
          </label>
          <input
            id="board-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter board name"
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            autoFocus
          />
        </div>

        <div>
          <label
            htmlFor="board-prefix"
            className="block text-sm font-medium text-dark-text mb-1"
          >
            Board Code <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              id="board-prefix"
              type="text"
              value={prefix}
              onChange={(e) => handlePrefixChange(e.target.value)}
              placeholder="e.g. NF"
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono tracking-wider uppercase pr-10"
              maxLength={5}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {checkingPrefix && (
                <Loader2 size={16} className="text-dark-text-muted animate-spin" />
              )}
              {!checkingPrefix && prefixAvailable === true && isValidPrefix && (
                <Check size={16} className="text-green-500" />
              )}
              {!checkingPrefix && prefixAvailable === false && isValidPrefix && (
                <X size={16} className="text-red-400" />
              )}
            </div>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs text-dark-text-muted">
              2-5 uppercase letters. Used for issue keys (e.g. {prefix || "NF"}-1, {prefix || "NF"}-2)
            </span>
            {!checkingPrefix && prefixAvailable === false && isValidPrefix && (
              <span className="text-xs text-red-400">Already taken</span>
            )}
          </div>
          {prefix && !isValidPrefix && (
            <p className="text-xs text-red-400 mt-1">
              Must be 2-5 uppercase letters
            </p>
          )}
        </div>

        <p className="text-xs text-amber-400/80">
          Board code cannot be changed after creation.
        </p>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-dark-text hover:bg-dark-hover rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create Board"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
