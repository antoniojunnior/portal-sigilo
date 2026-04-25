"use client";

import { useEffect } from "react";

export function SessionOrgId({ orgId }: { orgId: string }) {
  useEffect(() => {
    if (orgId) sessionStorage.setItem("org_id", orgId);
  }, [orgId]);
  return null;
}
