"use client"

import { cn } from "@/lib/utils"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerBody, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"

// Dialog no desktop, drawer (vaul) abaixo de 768px (seção 6 / 10).
export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  width = "md",
  className,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  width?: "sm" | "md" | "lg"
  className?: string
}) {
  const mobile = useIsMobile()
  if (mobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            {description ? <DrawerDescription>{description}</DrawerDescription> : null}
          </DrawerHeader>
          <DrawerBody className={className}>{children}</DrawerBody>
        </DrawerContent>
      </Drawer>
    )
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("gap-5 p-6", width === "sm" ? "sm:max-w-sm" : width === "lg" ? "sm:max-w-180" : "sm:max-w-lg", className)}>
        <DialogHeader>
          <DialogTitle className="font-display text-section">{title}</DialogTitle>
          {description ? <DialogDescription className="text-small text-ink-soft">{description}</DialogDescription> : null}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}
