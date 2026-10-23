export const GeminiFeature = {
  B2B_AD: "b2b-ad",
  FIRST_CONTACT: "first-contact",
  ASSISTANT_MEDIA: "assistant-media",
  CHAT_TOPIC: "chat-topic",
  CATALOG_ASSIST: "catalog-assist",
} as const;

export type GeminiFeatureId = (typeof GeminiFeature)[keyof typeof GeminiFeature];

export type GeminiAdInput = {
  businessName?: string;
  category?: string;
  product?: string;
  description?: string;
  offer?: string;
  audience?: string;
  tone?: string;
  extra?: string;
};

export type GeminiAdResult = {
  title: string;
  shortDescription: string;
  body: string;
  callToAction: string;
};

export type GeminiIcebreakerInput = {
  name?: string;
  headline?: string;
  interests?: string[];
  sharedInterests?: string[];
  notes?: string;
};

export type GeminiIcebreakerResult = {
  message: string;
};

export type GeminiChatTurn = {
  from: "me" | "them";
  text: string;
};

export type GeminiChatTopicInput = {
  peerName?: string;
  interests?: string[];
  sharedInterests?: string[];
  intent?: string;
  avoid?: string;
  notes?: string;
  messages?: GeminiChatTurn[];
};

export type GeminiChatTopicResult = {
  suggestion: string;
};

export type GeminiMediaInput = {
  intent?: string;
  avoid?: string;
  notes?: string;
};

export type GeminiMediaResult = {
  caption: string;
  direction: string;
};

export type GeminiCatalogAssistKind = "event" | "business" | "place";

export type GeminiCatalogAssistInput = {
  kind: GeminiCatalogAssistKind;
  intent?: string;
  title?: string;
  name?: string;
  description?: string;
  category?: string;
  location?: string;
  extra?: string;
};

export type GeminiVisualDirection = {
  style?: string;
  composition?: string;
  typography?: string;
  elementsToHighlight?: string[];
  currentAssessment?: string;
  improvements?: string[];
  hierarchy?: string;
  imagePrompt?: string;
};

export type GeminiCatalogSuggestion = {
  title?: string;
  subtitle?: string;
  description?: string;
  highlights?: string[];
  tags?: string[];
  visualDirection?: GeminiVisualDirection;
  divergence?: string;
};

export type GeminiCatalogAssistResult = {
  suggestion: GeminiCatalogSuggestion;
};

export type GeminiImageInput = {
  mimeType: string;
  data: string;
};

export type GeminiFeatureInput =
  | { feature: typeof GeminiFeature.B2B_AD; input: GeminiAdInput }
  | { feature: typeof GeminiFeature.FIRST_CONTACT; input: GeminiIcebreakerInput }
  | { feature: typeof GeminiFeature.ASSISTANT_MEDIA; input: GeminiMediaInput }
  | { feature: typeof GeminiFeature.CHAT_TOPIC; input: GeminiChatTopicInput }
  | { feature: typeof GeminiFeature.CATALOG_ASSIST; input: GeminiCatalogAssistInput };

export type GeminiGenerateRequest = GeminiFeatureInput & {
  actorId?: string;
  images?: GeminiImageInput[];
};

export type GeminiGeneratedData =
  | GeminiAdResult
  | GeminiIcebreakerResult
  | GeminiChatTopicResult
  | GeminiMediaResult
  | GeminiCatalogAssistResult;

export type GeminiGenerateSuccess = {
  ok: true;
  data: GeminiGeneratedData;
};

export type GeminiGenerateFailure = {
  ok: false;
  error: string;
  code: string;
};

export type GeminiGenerateResult = GeminiGenerateSuccess | GeminiGenerateFailure;

export type GenerateTextParams = {
  prompt: string;
  systemInstruction: string;
  maxOutputTokens: number;
  timeoutMs?: number;
  images?: GeminiImageInput[];
};

export type GenerateTextFn = (params: GenerateTextParams) => Promise<string>;
