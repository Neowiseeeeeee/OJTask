import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Eye, EyeOff, Check, X, Mail, KeyRound, ShieldCheck, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";

type Step = "email" | "otp" | "newPassword";

export default function ForgotPasswordPage() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<Step>("email");

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [emailConfigured, setEmailConfigured] = useState<boolean | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    fetch("/api/auth/email/status")
      .then((r) => r.json())
      .then((d) => setEmailConfigured(d.configured))
      .catch(() => setEmailConfigured(null));
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const passwordStrength = (() => {
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[!@#$%^&*]/.test(newPassword)) score++;
    if (score <= 1) return { level: "Weak", color: "bg-red-500", width: "25%" };
    if (score === 2) return { level: "Fair", color: "bg-yellow-500", width: "50%" };
    if (score === 3) return { level: "Good", color: "bg-blue-500", width: "75%" };
    return { level: "Strong", color: "bg-green-500", width: "100%" };
  })();

  const safeJson = async (res: Response) => {
    const text = await res.text();
    try { return JSON.parse(text); } catch { return { message: "Server error. Please try again." }; }
  };

  const sendOtp = async (targetEmail: string) => {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: targetEmail }),
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.message || "Failed to send code");
    setResendCooldown(60);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await sendOtp(email);
      setSuccessMsg("A 6-digit code has been sent to your email.");
      setStep("otp");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);
    try {
      await sendOtp(email);
      setOtp("");
      setSuccessMsg("A new code has been sent to your email.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, otp }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.message || "Invalid code");
      setSuccessMsg(null);
      setStep("newPassword");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.message || "Failed to reset password");
      setSuccessMsg("Password reset successfully! Redirecting to sign in...");
      setTimeout(() => setLocation("/auth"), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const stepTitles: Record<Step, { title: string; desc: string; icon: React.ReactNode }> = {
    email: {
      title: "Forgot your password?",
      desc: "Enter your email and we'll send you a reset code.",
      icon: <Mail className="w-8 h-8 text-white" />,
    },
    otp: {
      title: "Check your email",
      desc: `We sent a 6-digit code to ${email}`,
      icon: <ShieldCheck className="w-8 h-8 text-white" />,
    },
    newPassword: {
      title: "Set new password",
      desc: "Choose a strong password for your account.",
      icon: <KeyRound className="w-8 h-8 text-white" />,
    },
  };

  const current = stepTitles[step];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img src="/ojtask-logo.png" className="h-16 w-auto object-contain mb-2" alt="OJTask logo" />
          <p className="text-muted-foreground mt-2 text-sm">Your internship, organized and on track.</p>
        </div>

        <Card className="border-border/50 shadow-lg shadow-black/5 backdrop-blur-sm bg-card/95">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <div className="w-5 h-5 text-primary">{current.icon}</div>
              </div>
              <div>
                <CardTitle className="text-lg">{current.title}</CardTitle>
              </div>
            </div>
            <CardDescription>{current.desc}</CardDescription>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mt-3">
              {(["email", "otp", "newPassword"] as Step[]).map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step === s ? "bg-primary text-primary-foreground" :
                    ["email", "otp", "newPassword"].indexOf(step) > i ? "bg-green-500 text-white" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {["email", "otp", "newPassword"].indexOf(step) > i ? <Check className="w-3 h-3" /> : i + 1}
                  </div>
                  {i < 2 && <div className={`h-0.5 w-8 rounded-full transition-all ${["email", "otp", "newPassword"].indexOf(step) > i ? "bg-green-500" : "bg-muted"}`} />}
                </div>
              ))}
            </div>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                <X className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}
            {successMsg && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-green-800 dark:text-green-200">{successMsg}</p>
              </div>
            )}

            {step === "email" && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                {emailConfigured === false && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-amber-800 dark:text-amber-200">
                      <p className="font-semibold">Email not configured</p>
                      <p className="mt-0.5 text-xs">The server can't send emails yet. Add <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">GMAIL_USER</code> and <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">GMAIL_APP_PASSWORD</code> to your environment secrets.</p>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="fp-email">Email Address</Label>
                  <Input
                    id="fp-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-background"
                    placeholder="your@email.com"
                    autoComplete="email"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading || emailConfigured === false}>
                  {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending code...</> : "Send Reset Code"}
                </Button>
              </form>
            )}

            {step === "otp" && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fp-otp">6-Digit Code</Label>
                  <Input
                    id="fp-otp"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="bg-background text-center text-2xl font-bold tracking-[0.5em]"
                    placeholder="000000"
                    maxLength={6}
                    autoComplete="one-time-code"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading || otp.length !== 6}>
                  {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying...</> : "Verify Code"}
                </Button>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => { setStep("email"); setError(null); setSuccessMsg(null); setOtp(""); }}
                  >
                    ← Change email
                  </button>
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || isLoading}
                    onClick={handleResend}
                    className="text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 enabled:text-primary enabled:hover:text-primary/80"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                  </button>
                </div>
              </form>
            )}

            {step === "newPassword" && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fp-new-pass">New Password</Label>
                  <div className="relative">
                    <Input
                      id="fp-new-pass"
                      type={showPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-background pr-10"
                      placeholder="Create a strong password"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {newPassword && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Password Strength</span>
                        <span className="font-semibold">{passwordStrength.level}</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${passwordStrength.color} transition-all duration-300`} style={{ width: passwordStrength.width }} />
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fp-confirm-pass">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="fp-confirm-pass"
                      type={showConfirm ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-background pr-10"
                      placeholder="Confirm your password"
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && (
                    <div className="flex items-center gap-2">
                      {newPassword === confirmPassword
                        ? <><Check className="w-4 h-4 text-green-500" /><span className="text-xs text-green-600 dark:text-green-400">Passwords match</span></>
                        : <><X className="w-4 h-4 text-red-500" /><span className="text-xs text-red-600 dark:text-red-400">Passwords don't match</span></>}
                    </div>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading || newPassword !== confirmPassword || !newPassword}>
                  {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Resetting...</> : "Reset Password"}
                </Button>
              </form>
            )}

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setLocation("/auth")}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                Back to Sign In
              </button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
