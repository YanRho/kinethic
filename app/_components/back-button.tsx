"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, House } from "lucide-react";
import { ConfirmAction } from "@/components/confirm-action";
import { ActionButton } from "@/components/kinethic-ui";

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
    onBeforeBack?.();

    if (hasUsefulHistory()) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  };

  const button = (
    <ActionButton
      type="button"
      className="touch-button gap-2"
      onClick={navigateBack}
    >
      <ArrowLeft aria-hidden="true" className="h-4 w-4" />
      Back
    </ActionButton>
  );

  return confirmMessage ? (
    <ConfirmAction
      trigger={button}
      title="Leave this page?"
      description={confirmMessage}
      actionLabel="Leave"
      onConfirm={navigateBack}
    />
  ) : (
    button
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
    onBeforeHome?.();
    router.replace(href);
  };

  const button = (
    <ActionButton
      type="button"
      className="touch-button gap-2"
      onClick={navigateHome}
    >
      <House aria-hidden="true" className="h-4 w-4" />
      Home
    </ActionButton>
  );

  return confirmMessage ? (
    <ConfirmAction
      trigger={button}
      title="Return home?"
      description={confirmMessage}
      actionLabel="Leave workout"
      onConfirm={navigateHome}
    />
  ) : (
    button
  );
}
