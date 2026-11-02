"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Tabs (seção 6, M3): "pill" (padrão) com fundo deslizando e "line" com sublinhado deslizando.
// O indicador do Base UI anda com as variáveis --active-tab-*; a transição usa os tokens de motion.

function Tabs({ className, orientation = "horizontal", ...props }: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn("group/tabs flex gap-3 data-horizontal:flex-col", className)}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list relative inline-flex w-fit items-center text-ink-soft group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col",
  {
    variants: {
      variant: {
        default: "h-control gap-0.5 rounded-md border border-line bg-panel p-1",
        line: "h-control gap-5 border-b border-line",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

function TabsList({
  className,
  variant = "default",
  children,
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List data-slot="tabs-list" data-variant={variant} className={cn(tabsListVariants({ variant }), className)} {...props}>
      {children}
      <TabsPrimitive.Indicator
        data-slot="tabs-indicator"
        className={cn(
          "absolute z-0 transition-[translate,width,height] duration-base ease-out motion-reduce:transition-none",
          "top-(--active-tab-top) left-0 h-(--active-tab-height) w-(--active-tab-width) translate-x-(--active-tab-left)",
          variant === "line" ? "top-auto! bottom-[-1px] h-0.5! bg-paper" : "rounded-sm bg-selected"
        )}
      />
    </TabsPrimitive.List>
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "relative z-10 inline-flex h-full items-center justify-center gap-1.5 rounded-sm px-3 text-ui font-medium whitespace-nowrap text-ink-soft transition-colors duration-fast outline-none hover:text-paper disabled:pointer-events-none disabled:opacity-40 data-active:text-paper group-data-[variant=line]/tabs-list:px-0 group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

// Contagem dentro de uma aba ("Hoje 3").
function TabsCount({ children }: { children: React.ReactNode }) {
  return <span className="text-micro text-ink-muted tabular-nums">{children}</span>
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return <TabsPrimitive.Panel data-slot="tabs-content" className={cn("flex-1 outline-none", className)} {...props} />
}

export { Tabs, TabsContent, TabsCount, TabsList, TabsTrigger, tabsListVariants }
