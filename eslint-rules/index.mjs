// Custom ESLint rules for the ARCADE Cyber-Brutalist design system (§2.2, §11.3).
// Plain object-literal plugin — no build step needed.

function isNonZeroLiteral(node) {
  return (
    (node.type === "Literal" && typeof node.value === "number" && node.value !== 0) ||
    (node.type === "Literal" && typeof node.value === "string" && /^-?\d/.test(node.value) && node.value !== "0" && node.value !== "0px")
  );
}

const noRoundedCorners = {
  meta: { type: "problem", docs: { description: "borderRadius must be 0 — ARCADE has zero rounded corners (§2.2)." } },
  create(context) {
    return {
      Property(node) {
        const keyName = node.key?.name || node.key?.value;
        if (keyName === "borderRadius" && isNonZeroLiteral(node.value)) {
          context.report({ node, message: "borderRadius must be 0. ARCADE forbids rounded corners (§2.2, §14)." });
        }
      },
      JSXAttribute(node) {
        if (node.name?.name === "borderRadius") {
          const val = node.value?.expression ?? node.value;
          if (val && isNonZeroLiteral(val)) {
            context.report({ node, message: "borderRadius must be 0. ARCADE forbids rounded corners (§2.2, §14)." });
          }
        }
      },
    };
  },
};

// `blur` alone would also match React Native's legitimate onBlur/onFocus-pair
// event prop (nothing to do with visual blur) — exclude the "on"-prefixed
// event-handler spelling specifically, still catching blurRadius, BlurView,
// backdropBlur, etc.
const FORBIDDEN_NAME_RE = /gradient|backdropfilter|(?<!on)blur/i;

const noSoftEffects = {
  meta: { type: "problem", docs: { description: "No gradients, blur, or backdrop-filter components/props — ARCADE is flat (§2.2, §14)." } },
  create(context) {
    return {
      JSXIdentifier(node) {
        if (FORBIDDEN_NAME_RE.test(node.name)) {
          context.report({ node, message: `"${node.name}" looks like a gradient/blur component. Forbidden in ARCADE (§2.2, §14).` });
        }
      },
      Property(node) {
        const keyName = node.key?.name || node.key?.value;
        if (typeof keyName === "string" && FORBIDDEN_NAME_RE.test(keyName)) {
          context.report({ node, message: `"${keyName}" is a soft-effect style. Forbidden in ARCADE (§2.2, §14).` });
        }
        if (keyName === "shadowRadius" && isNonZeroLiteral(node.value)) {
          context.report({ node, message: "shadowRadius must be 0 — ARCADE shadows are hard offsets with zero blur (§2.2)." });
        }
      },
    };
  },
};

// Rule 6: numeric-bearing <Text> must carry the mono font style. Heuristic:
// flags <Text>{someNumericExpression}</Text> without a style prop referencing `font.mono`.
const numericTextMustBeMono = {
  meta: { type: "problem", docs: { description: "Numerals (balances, XP, gas, addresses, dates) must render in JetBrains Mono (§2.2)." } },
  create(context) {
    function looksNumeric(child) {
      if (child.type === "JSXExpressionContainer") {
        const src = context.sourceCode.getText(child.expression);
        return /balance|amount|xp|gas|address|hash|price|block|percent|date|nonce/i.test(src);
      }
      if (child.type === "JSXText") {
        return /^\s*[\d$.,%]+\s*$/.test(child.value);
      }
      return false;
    }
    return {
      JSXElement(node) {
        if (node.openingElement.name?.name !== "Text") return;
        const hasNumericChild = node.children.some(looksNumeric);
        if (!hasNumericChild) return;
        const styleAttr = node.openingElement.attributes.find((a) => a.name?.name === "style");
        const styleSrc = styleAttr ? context.sourceCode.getText(styleAttr) : "";
        if (!/mono/i.test(styleSrc)) {
          context.report({ node, message: "Numeric <Text> must use font.mono (JetBrains Mono) — see packages/ui/src/tokens.ts (§2.2)." });
        }
      },
    };
  },
};

export default {
  rules: {
    "no-rounded-corners": noRoundedCorners,
    "no-soft-effects": noSoftEffects,
    "numeric-text-must-be-mono": numericTextMustBeMono,
  },
};
