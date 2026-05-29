"use client";

import { useEffect } from "react";
import { inspectClientRootHtml } from "@/lib/hydrationDiagnostics";

type HydrationDiagnosticsProps = {
  serverRootClass: string;
};

export default function HydrationDiagnostics({
  serverRootClass,
}: HydrationDiagnosticsProps) {
  useEffect(() => {
    inspectClientRootHtml(serverRootClass);
  }, [serverRootClass]);

  return null;
}
