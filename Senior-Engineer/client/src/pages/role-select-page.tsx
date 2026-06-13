import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, GraduationCap, Briefcase, School } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLES = [
  {
    value: "student",
    label: "Student",
    icon: GraduationCap,
    description: "I'm completing my internship / OJT requirements.",
    color: "text-violet-400",
    border: "border-violet-500/60",
    bg: "bg-violet-500/10",
    ring: "ring-violet-500",
  },
  {
    value: "supervisor",
    label: "Supervisor",
    icon: Briefcase,
    description: "I'm mentoring interns at a company or organization.",
    color: "text-blue-400",
    border: "border-blue-500/60",
    bg: "bg-blue-500/10",
    ring: "ring-blue-500",
  },
  {
    value: "school",
    label: "School Coordinator",
    icon: School,
    description: "I'm coordinating internship placements from a school.",
    color: "text-emerald-400",
    border: "border-emerald-500/60",
    bg: "bg-emerald-500/10",
    ring: "ring-emerald-500",
  },
] as const;

type RoleValue = (typeof ROLES)[number]["value"];

export default function RoleSelectPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selected, setSelected] = useState<RoleValue | null>(null);

  const { data: profile, isLoading: profileLoading, isError } = useQuery({
    queryKey: ["/api/auth/pending-profile"],
    retry: false,
  });

  useEffect(() => {
    if (isError) {
      navigate("/auth");
    }
  }, [isError, navigate]);

  const completeMutation = useMutation({
    mutationFn: async (role: RoleValue) => {
      const res = await apiRequest("POST", "/api/auth/complete-google-signup", { role });
      return res.json();
    },
    onSuccess: () => {
      window.location.href = "/dashboard";
    },
    onError: () => {
      toast({ title: "Something went wrong", description: "Please try signing in again.", variant: "destructive" });
      navigate("/auth");
    },
  });

  const handleContinue = () => {
    if (!selected) return;
    completeMutation.mutate(selected);
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const p = profile as { name?: string; email?: string; picture?: string } | undefined;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          {p?.picture && (
            <img
              src={p.picture}
              alt={p.name ?? ""}
              className="w-16 h-16 rounded-full mx-auto mb-4 ring-2 ring-border"
            />
          )}
          <h1 className="text-2xl font-bold text-foreground">Welcome, {p?.name?.split(" ")[0] ?? "there"}!</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Just one more step — how will you be using OJTask?
          </p>
        </div>

        <div className="space-y-3 mb-8">
          {ROLES.map((role) => {
            const Icon = role.icon;
            const isSelected = selected === role.value;
            return (
              <button
                key={role.value}
                type="button"
                onClick={() => setSelected(role.value)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-150",
                  isSelected
                    ? `${role.border} ${role.bg} ring-2 ${role.ring}`
                    : "border-border bg-card hover:border-muted-foreground/40 hover:bg-muted/40"
                )}
              >
                <div className={cn("flex-shrink-0 w-11 h-11 rounded-lg flex items-center justify-center", role.bg)}>
                  <Icon className={cn("w-5 h-5", role.color)} />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{role.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>
                </div>
                <div className={cn(
                  "ml-auto flex-shrink-0 w-4 h-4 rounded-full border-2 transition-colors",
                  isSelected ? `${role.border} ${role.bg}` : "border-border"
                )}>
                  {isSelected && <div className={cn("w-full h-full rounded-full scale-50", role.bg.replace("/10", ""))} />}
                </div>
              </button>
            );
          })}
        </div>

        <Button
          className="w-full"
          size="lg"
          disabled={!selected || completeMutation.isPending}
          onClick={handleContinue}
        >
          {completeMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Setting up your account…
            </>
          ) : (
            "Continue"
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground mt-4">
          You can change your role later in Settings.
        </p>
      </div>
    </div>
  );
}
