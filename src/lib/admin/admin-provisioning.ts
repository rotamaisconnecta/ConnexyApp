export type AdminAppMetadata = Record<string, unknown>;

export function grantPlatformAdmin(appMetadata: AdminAppMetadata = {}): AdminAppMetadata {
  return { ...appMetadata, platform_role: "admin" };
}

export function revokePlatformAdmin(appMetadata: AdminAppMetadata = {}): AdminAppMetadata {
  const next = { ...appMetadata };
  delete next.platform_role;
  return next;
}
