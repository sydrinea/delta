"use client";

import { useEffect, useState } from "react";
import type { MachineType } from "../../../../packages/proto/src";

interface UseMachineShareOptions {
  machineType: MachineType;
  code: string;
  canShare: boolean;
  onLoadCode: (code: string) => void;
  onShareError: () => void;
}

export function useMachineShare({
  machineType,
  code,
  canShare,
  onLoadCode,
  onShareError,
}: UseMachineShareOptions) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const machineId = params.get("m");

    const SHARE_URL = window.location.hostname.includes("comptheory.tools")
      ? "https://share.comptheory.tools"
      : "https://share.delta.sydneyn.dev";

    if (machineId) {
      fetch(`${SHARE_URL}/machine/${machineId}`)
        .then(
          (res) =>
            res.json() as Promise<{ machineType: "nfa" | "tm"; code: string }>,
        )
        .then((payload) => {
          if (payload.machineType !== machineType) {
            return;
          }

          onLoadCode(payload.code);
        })
        .catch(() => {})
        .finally(() => {
          window.history.replaceState({}, "", window.location.pathname);
        });
    }
  }, [machineType, onLoadCode]);

  const handleShare = async () => {
    if (!canShare) return;

    const SHARE_URL = window.location.hostname.includes("comptheory.tools")
      ? "https://share.comptheory.tools"
      : "https://share.delta.sydneyn.dev";

    try {
      const res = await fetch(`${SHARE_URL}/machine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ machineType, code }),
      });
      const { id } = (await res.json()) as { id: string };
      const url = `${window.location.origin}?m=${id}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onShareError();
    }
  };

  return {
    copied,
    handleShare,
  };
}
