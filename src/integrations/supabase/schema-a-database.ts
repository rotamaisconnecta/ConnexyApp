/**
 * Schema A technical contract.
 *
 * Re-exports the generated dump without copying tables.
 * Remote repositories and createSchemaAClient must use this module.
 * The Lovable Database types stay on the legacy UI client.
 */
export type {
  Database as SchemaADatabase,
  Json as SchemaAJson,
} from "../../../supabase/schema-a.generated.ts";
