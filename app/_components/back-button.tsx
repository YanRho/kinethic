"use client";

import { useRouter } from "next/navigation";

type BackButtonProps = {
  fallbackHref: string;
  confirmMessage?: string;
  onBeforeBack?: () => void;
};

function hasUsefulHistory() {
  const historyIndex = window.history.state?.idx;
  const hasIndexedHistory =
    typeof historyIndex === "number" && historyIndex > 0;
  const hasSameOriginReferrer = (() => {
    if (!document.referrer) {
      return false;
    }

    try {
      return new URL(document.referrer).origin === window.location.origin;
    } catch {
      return false;
    }
  })();

  return (
    window.history.length > 1 && (hasIndexedHistory || hasSameOriginReferrer)
  );
}

export function BackButton({
  fallbackHref,
  confirmMessage,
  onBeforeBack,
}: BackButtonProps) {
  const router = useRouter();

  const navigateBack = () => {
    if (confirmMessage && !window.confirm(confirmMessage)) {
      return;
    }

    onBeforeBack?.();

    if (hasUsefulHistory()) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  };

  return (
    <button className="touch-button muted-button" onClick={navigateBack}>
      ← Back
    </button>
  );
}
