import { useState, useCallback, useEffect } from "react";
import { checkPermission, requestPermission } from "@/lib/system/permission-utils";
import type { PermissionKind } from "@/lib/system/permission-utils";
import { PermissionStatus } from "@/lib/system/system-types";
import type { PermissionStatusValue } from "@/lib/system/system-types";

interface UsePermissionsReturn {
  status: PermissionStatusValue;
  isGranted: boolean;
  isDenied: boolean;
  isPrompt: boolean;
  check: () => Promise<void>;
  request: () => Promise<void>;
}

interface UsePermissionsOptions {
  kind: PermissionKind;
  autoCheck?: boolean;
}

export function usePermissions({
  kind,
  autoCheck = true,
}: UsePermissionsOptions): UsePermissionsReturn {
  const [status, setStatus] = useState<PermissionStatusValue>(PermissionStatus.PROMPT);

  const check = useCallback(async () => {
    const result = await checkPermission(kind);
    setStatus(result);
  }, [kind]);

  const request = useCallback(async () => {
    const result = await requestPermission(kind);
    setStatus(result);
  }, [kind]);

  useEffect(() => {
    if (autoCheck) check();
  }, [autoCheck, check]);

  return {
    status,
    isGranted: status === PermissionStatus.GRANTED,
    isDenied: status === PermissionStatus.DENIED,
    isPrompt: status === PermissionStatus.PROMPT,
    check,
    request,
  };
}
