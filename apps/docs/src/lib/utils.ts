import { type ClassValue, cn as joinClasses, twMerge } from "cnfast";

// className helper for shadcn-style components.
export function cn(...inputs: ClassValue[]) {
  return twMerge(joinClasses(...inputs));
}
