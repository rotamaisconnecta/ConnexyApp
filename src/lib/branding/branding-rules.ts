/* =========================================================
   branding-rules.ts — Official Connexy branding rules.
   Documents what is PROHIBITED and what is ALLOWED
   across the entire codebase.
========================================================= */

export const BRANDING_RULES = {
  prohibited: {
    colors: [
      "Tailwind HEX hardcoded (e.g. [#6C3BFF])",
      "Inline rgba() colors",
      "Inline CSS color values",
    ],
    gradients: [
      "Hardcoded bg-gradient-to-* with inline hex",
      "Inline linear-gradient() in style props",
    ],
    branding: [
      "Old logo / Connexa references",
      "Placeholder text as icons (C, +, emoji)",
      "Temporary SVG icons",
      "Temporary images",
    ],
    components: [
      "Raw <button> (use BrandButton)",
      "Raw <input> (use BrandInput)",
      "Raw <Card> (use BrandCard)",
      "Raw <Avatar> (use BrandAvatar)",
      "Raw <Badge> (use BrandBadge)",
    ],
  } as const,

  allowed: {
    components: [
      "BrandLogo",
      "AppIcon",
      "BrandButton",
      "BrandInput",
      "BrandCard",
      "BrandAvatar",
      "BrandBadge",
      "BrandScreen",
      "BrandBackground",
      "BrandGradient",
      "BrandHeader",
      "BrandFooter",
      "BrandDivider",
      "BrandSection",
      "BrandPageTitle",
      "BrandIcon",
    ],
    tokens: [
      "theme.colors",
      "theme.gradients",
      "theme.typography",
      "theme.spacing",
      "theme.radius",
      "theme.shadows",
      "theme.animations",
      "theme.icons",
    ],
    imports: [
      "Colors from @/theme",
      "Gradients from @/theme",
      "Typography from @/theme",
      "Spacing from @/theme",
      "Radius from @/theme",
      "Shadows from @/theme",
      "Animations from @/theme",
      "Brand from @/lib/branding/brand-config",
      "Logo from @/lib/branding/brand-config",
      "Theme from @/lib/branding/brand-config",
      "BRAND_TOKENS from @/lib/branding/brand-tokens",
    ],
  } as const,
} as const;
