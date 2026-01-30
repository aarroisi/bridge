import { X, CheckCircle, XCircle, Info, AlertTriangle } from "lucide-react";
import { clsx } from "clsx";
import { useToastStore, Toast as ToastType } from "@/stores/toastStore";

// Helper for showing toasts
export const toast = {
  success: (message: string) => useToastStore.getState().success(message),
  error: (message: string) => useToastStore.getState().error(message),
};

interface ToastProps {
  toast: ToastType;
}

export function Toast({ toast }: ToastProps) {
  const { removeToast } = useToastStore();

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <CheckCircle size={20} />;
      case "error":
        return <XCircle size={20} />;
      case "warning":
        return <AlertTriangle size={20} />;
      case "info":
        return <Info size={20} />;
    }
  };

  const getColorClasses = () => {
    switch (toast.type) {
      case "success":
        return "bg-green-600 text-white";
      case "error":
        return "bg-red-600 text-white";
      case "warning":
        return "bg-yellow-600 text-white";
      case "info":
        return "bg-blue-600 text-white";
    }
  };

  return (
    <div
      className={clsx(
        "flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg min-w-[300px] max-w-[500px]",
        getColorClasses(),
      )}
    >
      <div className="flex-shrink-0">{getIcon()}</div>
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 hover:opacity-80 transition-opacity"
      >
        <X size={18} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useToastStore();

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
