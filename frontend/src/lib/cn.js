import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Junta classes Tailwind; se duas classes brigarem (ex.: "px-2" e "px-4"), vale a última.
export function cn(...classes) {
  return twMerge(clsx(classes));
}
