"use client";

import { useEffect } from "react";

export function SessionOrgId({ orgId, orgNome }: { orgId: string; orgNome?: string }) {
  useEffect(() => {
    if (orgId) sessionStorage.setItem("org_id", orgId);
    if (orgNome) sessionStorage.setItem("org_nome", orgNome);
  }, [orgId, orgNome]);
  return null;
}
