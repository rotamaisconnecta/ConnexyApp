export class AdapterMappingError extends Error {
  readonly code: string;
  readonly field?: string;

  constructor(message: string, code: string, field?: string) {
    super(message);
    this.name = "AdapterMappingError";
    this.code = code;
    this.field = field;
  }
}

export const AdapterMappingCode = {
  NOT_UUID: "NOT_UUID",
  MISSING_OWNER: "MISSING_OWNER",
  MISSING_TARGET_TYPE: "MISSING_TARGET_TYPE",
  UNMAPPED_STATUS: "UNMAPPED_STATUS",
  UNMAPPED_PRIVACY: "UNMAPPED_PRIVACY",
  UNMAPPED_KIND: "UNMAPPED_KIND",
  INVALID_JSON: "INVALID_JSON",
  MISSING_MEDIA: "MISSING_MEDIA",
  IDENTITY_COLLISION: "IDENTITY_COLLISION",
} as const;

export type AdapterMappingCodeValue = (typeof AdapterMappingCode)[keyof typeof AdapterMappingCode];
