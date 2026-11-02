// Tokens de motion (5.2). Mesmos valores das variáveis --duration-* e --ease-* do globals.css.

export const ease = { out: [0.2, 0.8, 0.2, 1], inOut: [0.65, 0, 0.35, 1] } as const
export const dur = { instant: 0.09, fast: 0.16, base: 0.24, slow: 0.42, story: 0.9 } as const

export const spring = {
  snappy: { type: "spring", stiffness: 520, damping: 38, mass: 0.8 }, // abas, toggles, checks
  layout: { type: "spring", stiffness: 380, damping: 34 }, // reordenação, layout
  drag: { type: "spring", stiffness: 260, damping: 26 }, // soltar cartão
  sheet: { type: "spring", stiffness: 320, damping: 36 }, // drawer, dialog
} as const

export const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: dur.fast, ease: ease.out },
}

// Entrada de popovers, menus e dialogs.
export const lift = {
  initial: { opacity: 0, y: 6, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 4, scale: 0.98 },
  transition: { duration: dur.fast, ease: ease.out },
}

// Item que entra/sai de uma lista (M9).
export const itemLista = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: "auto" },
  exit: { opacity: 0, height: 0 },
  transition: spring.layout,
}
