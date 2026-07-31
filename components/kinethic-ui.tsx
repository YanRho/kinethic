import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ActionTone = "primary" | "secondary" | "danger" | "ghost";

const actionStyles: Record<ActionTone, string> = {
  primary: "primary-button",
  secondary: "muted-button",
  danger: "danger-button",
  ghost: "min-h-11 text-slate-300 hover:bg-white/5",
};

export function ActionButton({
  tone = "secondary",
  className,
  ...props
}: React.ComponentProps<typeof Button> & { tone?: ActionTone }) {
  return (
    <Button
      variant="ghost"
      className={cn(actionStyles[tone], className)}
      {...props}
    />
  );
}

export function AppInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return <Input className={cn(className)} {...props} />;
}

export function AppTextarea({
  className,
  ...props
}: React.ComponentProps<typeof Textarea>) {
  return <Textarea className={cn(className)} {...props} />;
}

export function Surface({
  className,
  ...props
}: React.ComponentProps<typeof Card>) {
  return <Card className={cn("panel gap-0 py-0", className)} {...props} />;
}

export function StatusBadge({
  className,
  ...props
}: React.ComponentProps<typeof Badge>) {
  return (
    <Badge
      variant="outline"
      className={cn("theme-accent-surface theme-accent-text", className)}
      {...props}
    />
  );
}