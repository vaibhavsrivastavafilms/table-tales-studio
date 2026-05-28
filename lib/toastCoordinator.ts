import { MOTION } from "@/lib/motion";

type ToastEntry = {
  message: string;
  variant: "success" | "error";
  at: number;
};

let lastToast: ToastEntry | null = null;

export function shouldShowToast(
  message: string,
  variant: "success" | "error" = "success"
): boolean {
  const now = Date.now();
  if (
    lastToast &&
    lastToast.message === message &&
    lastToast.variant === variant &&
    now - lastToast.at < MOTION.toastMs * 0.5
  ) {
    return false;
  }
  lastToast = { message, variant, at: now };
  return true;
}

export function clearToastCoordinator(): void {
  lastToast = null;
}
