import { createCn } from "cn/config"

// Junta classes do Tailwind resolvendo conflitos. O merge precisa conhecer os tamanhos de texto do redesign
// (text-ui, text-body…): sem isso ele os confunde com cor e descarta, por exemplo, o "text-night" do botão
// primário, deixando o texto da mesma cor do fundo.
export const cn = createCn({
  extend: {
    theme: {
      text: ["display-xl", "display-lg", "display-md", "title", "section", "number", "body-lg", "body", "ui", "small", "micro", "code"],
    },
  },
})
