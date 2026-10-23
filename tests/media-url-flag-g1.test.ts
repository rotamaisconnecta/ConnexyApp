import { afterEach, describe, expect, test } from "bun:test";
import { setRemoteAuthGateForTests } from "../src/lib/auth/schema-a-auth-flag";
import {
  isMediaUrlFlagEnabled,
  isMediaUrlSigningEnabled,
  setMediaUrlGateForTests,
} from "../src/lib/media/media-url-flag";

const ENV_KEY = "VITE_APP_SCHEMA_A_MEDIA_URL" as const;
const original = import.meta.env[ENV_KEY];

function setEnv(value: string | undefined): void {
  if (value === undefined) {
    delete import.meta.env[ENV_KEY];
  } else {
    import.meta.env[ENV_KEY] = value;
  }
}

afterEach(() => {
  setMediaUrlGateForTests(null);
  setRemoteAuthGateForTests(null);
  setEnv(original);
});

describe("G1 L3 media URL flag", () => {
  test("is OFF by default when the env value is absent", () => {
    setEnv(undefined);
    expect(isMediaUrlFlagEnabled()).toBe(false);
  });

  test("only the exact approved string enables the flag", () => {
    for (const value of ["TRUE", "True", "1", "yes", " true", "true "]) {
      setEnv(value);
      expect(isMediaUrlFlagEnabled()).toBe(false);
    }
    setEnv("true");
    expect(isMediaUrlFlagEnabled()).toBe(true);
  });

  test("signing stays subordinate to remote Auth", () => {
    setRemoteAuthGateForTests({
      isDemoMode: () => false,
      isFlagEnabled: () => false,
      isPublicSupabaseConfigured: () => true,
    });
    setMediaUrlGateForTests({ isFlagEnabled: () => true });
    expect(isMediaUrlSigningEnabled()).toBe(false);

    setRemoteAuthGateForTests({
      isDemoMode: () => false,
      isFlagEnabled: () => true,
      isPublicSupabaseConfigured: () => true,
    });
    expect(isMediaUrlSigningEnabled()).toBe(true);
  });

  test("demo mode never enables signing even with every flag on", () => {
    setRemoteAuthGateForTests({
      isDemoMode: () => true,
      isFlagEnabled: () => true,
      isPublicSupabaseConfigured: () => true,
    });
    setMediaUrlGateForTests({ isFlagEnabled: () => true });
    expect(isMediaUrlSigningEnabled()).toBe(false);
  });

  test("the test gate does not leak between cases", () => {
    setRemoteAuthGateForTests({
      isDemoMode: () => false,
      isFlagEnabled: () => true,
      isPublicSupabaseConfigured: () => true,
    });
    setMediaUrlGateForTests({ isFlagEnabled: () => true });
    expect(isMediaUrlSigningEnabled()).toBe(true);

    setMediaUrlGateForTests(null);
    setEnv(undefined);
    expect(isMediaUrlFlagEnabled()).toBe(false);
    expect(isMediaUrlSigningEnabled()).toBe(false);
  });
});
