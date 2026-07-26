"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, House } from "lucide-react";

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
    <button
      type="button"
      className="touch-button muted-button gap-2"
      onClick={navigateBack}
    >
      <ArrowLeft aria-hidden="true" className="h-4 w-4" />
      Back
    </button>
  );
}

export function HomeButton({
  href = "/",
  confirmMessage,
  onBeforeHome,
}: {
  href?: string;
  confirmMessage?: string;
  onBeforeHome?: () => void;
}) {
  const router = useRouter();

  const navigateHome = () => {
    if (confirmMessage && !window.confirm(confirmMessage)) {
      return;
    }

    onBeforeHome?.();
    router.replace(href);
  };

  return (
    <button
      type="button"
      className="touch-button muted-button gap-2"
      onClick={navigateHome}
    >
      <House aria-hidden="true" className="h-4 w-4" />
      Home
    </button>
  );
}
