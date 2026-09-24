"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";

function Sheet({ ...props }: Dialog.Root.Props) {
  return <Dialog.Root {...props} />;
}

function SheetTrigger({ ...props }: Dialog.Trigger.Props) {
  return <Dialog.Trigger {...props} />;
}

function SheetPortal({ ...props }: Dialog.Portal.Props) {
  return <Dialog.Portal {...props} />;
}

function SheetClose({ ...props }: Dialog.Close.Props) {
  return <Dialog.Close {...props} />;
}

function SheetOverlay({ className, ...props }: Dialog.Backdrop.Props) {
  return (
    <Dialog.Backdrop
      className={cn(
        "fixed inset-0 z-40 bg-black/50 transition-opacity duration-200",
        "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
        className,
      )}
      {...props}
    />
  );
}

const sheetSides = {
  left: "inset-y-0 left-0 w-[min(320px,85vw)] border-r data-[starting-style]:-translate-x-full data-[ending-style]:-translate-x-full",
  right:
    "inset-y-0 right-0 w-[min(320px,85vw)] border-l data-[starting-style]:translate-x-full data-[ending-style]:translate-x-full",
  top: "inset-x-0 top-0 border-b data-[starting-style]:-translate-y-full data-[ending-style]:-translate-y-full",
  bottom:
    "inset-x-0 bottom-0 border-t data-[starting-style]:translate-y-full data-[ending-style]:translate-y-full",
} as const;

function SheetContent({
  className,
  side = "left",
  children,
  ...props
}: Dialog.Popup.Props & { side?: keyof typeof sheetSides }) {
  return (
    <Dialog.Portal>
      <SheetOverlay />
      <Dialog.Popup
        className={cn(
          "fixed z-50 flex flex-col bg-(--header-menu-bg) text-(--header-fg) shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          sheetSides[side],
          className,
        )}
        {...props}
      >
        {children}
        <Dialog.Close
          aria-label="Close"
          className="absolute top-3 right-3 grid size-[34px] place-items-center rounded-[7px] border border-(--header-search-border) text-(--header-menu-button-fg)"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={17} aria-hidden="true" />
        </Dialog.Close>
      </Dialog.Popup>
    </Dialog.Portal>
  );
}

function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5 p-4", className)} {...props} />;
}

function SheetTitle({ className, ...props }: Dialog.Title.Props) {
  return <Dialog.Title className={cn("font-semibold", className)} {...props} />;
}

function SheetDescription({ className, ...props }: Dialog.Description.Props) {
  return (
    <Dialog.Description className={cn("text-sm text-(--header-menu-fg)", className)} {...props} />
  );
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
};
