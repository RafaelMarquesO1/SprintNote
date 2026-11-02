import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Redesign v2 (regra 0.6 / 3.4): cores, espaços, raios e durações só vêm de tokens.
// Bloqueia #hex e valores arbitrários "[...]" de cor, espaço, raio, sombra e duração em className nas pastas novas.
// Seletores (data-[...]), grades (grid-cols-[...]) e env() da área segura continuam permitidos.
const PADRAO_PROIBIDO =
  /(^|[\s:])(?:bg|text|border(?:-[trblxy])?|ring|fill|stroke|outline|shadow|from|via|to|decoration|caret|accent|rounded(?:-[a-z]+)?|duration|delay|ease|p[trblxy]?|m[trblxy]?|gap(?:-[xy])?|w|h|size|min-w|min-h|max-w|max-h|top|left|right|bottom|inset(?:-[xy])?|tracking|leading)-\[(?!env\()[^\]]+\]|#[0-9a-fA-F]{3,8}\b/;

function textoDe(no) {
  if (!no) return "";
  if (no.type === "Literal" && typeof no.value === "string") return no.value;
  if (no.type === "TemplateLiteral") return no.quasis.map((parte) => parte.value.cooked ?? "").join(" ");
  return "";
}

const tokensSomente = {
  meta: { type: "problem", messages: { arbitrario: "Use um token do design system em vez de \"{{valor}}\" (veja a seção 3 do redesign)." } },
  create(contexto) {
    const verificar = (no) => {
      const texto = textoDe(no);
      const achado = PADRAO_PROIBIDO.exec(texto);
      if (achado) contexto.report({ node: no, messageId: "arbitrario", data: { valor: achado[0].trim() } });
    };
    return {
      JSXAttribute(no) {
        if (no.name.name !== "className" || !no.value) return;
        if (no.value.type === "Literal") return verificar(no.value);
        if (no.value.type === "JSXExpressionContainer") {
          const expressao = no.value.expression;
          if (expressao.type === "CallExpression") expressao.arguments.forEach(verificar);
          else verificar(expressao);
        }
      },
    };
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["components/motion/**", "components/shell/**", "components/features/**", "app/(publico)/**"],
    plugins: { sprintnote: { rules: { "tokens-somente": tokensSomente } } },
    rules: { "sprintnote/tokens-somente": "error" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "test-results/**",
    "playwright-report/**",
  ]),
]);

export default eslintConfig;
