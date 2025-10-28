

import { createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = "info") => {
        const id = Math.random().toString(36).substring(7);
        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={cn(
                            "flex items-center gap-3 px-4 py-3 border shadow-lg animate-in slide-in-from-right",
                            toast.type === "success" && "bg-primary/10 border-primary text-primary",
                            toast.type === "error" && "bg-destructive/10 border-destructive text-destructive",
                            toast.type === "info" && "bg-card border-border"
                        )}
                    >
                        {toast.type === "success" && <CheckCircle className="h-5 w-5" />}
                        {toast.type === "error" && <AlertCircle className="h-5 w-5" />}
                        {toast.type === "info" && <Info className="h-5 w-5" />}
                        <span className="text-sm font-medium">{toast.message}</span>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="ml-2 hover:opacity-70"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within ToastProvider");
    }
    return context;
}

