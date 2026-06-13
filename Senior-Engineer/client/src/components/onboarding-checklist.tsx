import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { CheckCircle2, Circle, X, UserCircle, ImageIcon, Users, ChevronRight, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OnboardingStatus {
  profileComplete: boolean;
  pictureUploaded: boolean;
  spaceJoined: boolean;
  accountAgeDays: number;
}

const STEPS = [
  {
    key: "profileComplete" as const,
    icon: UserCircle,
    title: "Complete your profile",
    description: "Add your name, email, and organization.",
    href: "/profile",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  {
    key: "pictureUploaded" as const,
    icon: ImageIcon,
    title: "Upload a profile picture",
    description: "Help teammates put a face to your name.",
    href: "/profile",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    key: "spaceJoined" as const,
    icon: Users,
    title: "Join or create a space",
    description: "Use the sidebar to connect to your internship workspace.",
    href: null,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
];

function dismissKey(userId: number) {
  return `ojtask_onboarding_dismissed_${userId}`;
}

export function OnboardingChecklist() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [dismissed, setDismissed] = useState(false);
  const [allDoneShown, setAllDoneShown] = useState(false);

  const { data: status } = useQuery<OnboardingStatus>({
    queryKey: ["/api/onboarding/status"],
    enabled: !!user,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (user && localStorage.getItem(dismissKey(user.id)) === "1") {
      setDismissed(true);
    }
  }, [user]);

  const handleDismiss = () => {
    if (user) localStorage.setItem(dismissKey(user.id), "1");
    setDismissed(true);
  };

  if (!user || !status || dismissed) return null;

  const doneCount = STEPS.filter((s) => status[s.key]).length;
  const allDone = doneCount === STEPS.length;

  if (allDone && !allDoneShown) {
    setTimeout(() => {
      setAllDoneShown(true);
      setTimeout(handleDismiss, 3000);
    }, 0);
  }

  if (allDone && allDoneShown) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
          <PartyPopper className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <p className="font-semibold text-emerald-400 text-sm">You're all set!</p>
          <p className="text-xs text-muted-foreground mt-0.5">Your account is fully configured. Have a great internship!</p>
        </div>
      </div>
    );
  }

  if (allDone) return null;

  if (status.accountAgeDays > 30) {
    handleDismiss();
    return null;
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i < doneCount ? "bg-primary w-5" : "bg-muted w-3"
                )}
              />
            ))}
          </div>
          <span className="text-sm font-semibold text-foreground">Get started</span>
          <span className="text-xs text-muted-foreground">
            {doneCount} of {STEPS.length} done
          </span>
        </div>
        <button
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="divide-y divide-border">
        {STEPS.map((step) => {
          const done = status[step.key];
          const Icon = step.icon;
          return (
            <div
              key={step.key}
              className={cn(
                "flex items-center gap-4 px-5 py-3.5 transition-colors",
                !done && step.href && "cursor-pointer hover:bg-muted/40",
                done && "opacity-60"
              )}
              onClick={() => {
                if (!done && step.href) navigate(step.href);
              }}
            >
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", done ? "bg-emerald-500/10" : step.bg)}>
                <Icon className={cn("w-4 h-4", done ? "text-emerald-400" : step.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium", done && "line-through text-muted-foreground")}>{step.title}</p>
                {!done && <p className="text-xs text-muted-foreground mt-0.5 truncate">{step.description}</p>}
              </div>
              {done ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              ) : step.href ? (
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground/40 shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
