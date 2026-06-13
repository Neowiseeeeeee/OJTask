import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Eye, EyeOff, Check, X, AlertCircle, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLocation, Link } from "wouter";

function PasswordStrengthIndicator({ password }: { password: string }) {
  const strength = {
    score: 0,
    level: "weak",
    color: "bg-red-500",
  };

  if (password.length >= 8) strength.score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength.score++;
  if (/[0-9]/.test(password)) strength.score++;
  if (/[!@#$%^&*]/.test(password)) strength.score++;

  if (strength.score <= 1) {
    strength.level = "weak";
    strength.color = "bg-red-500";
  } else if (strength.score === 2) {
    strength.level = "fair";
    strength.color = "bg-yellow-500";
  } else if (strength.score === 3) {
    strength.level = "good";
    strength.color = "bg-blue-500";
  } else {
    strength.level = "strong";
    strength.color = "bg-green-500";
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Password Strength</span>
        <span className="font-semibold capitalize">{strength.level}</span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full ${strength.color} transition-all duration-300`}
          style={{ width: `${(strength.score / 4) * 100}%` }}
        />
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function AuthPage() {
  const { login, register, isLoginPending, isRegisterPending, user } = useAuth();
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  const { data: googleStatus } = useQuery<{ enabled: boolean; callbackUrl: string }>({
    queryKey: ["/api/auth/google/status"],
    queryFn: () => fetch("/api/auth/google/status").then((r) => r.json()),
    staleTime: Infinity,
  });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle Google OAuth errors/success redirected back via query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err === "google_cancelled") setError("Google sign-in was cancelled.");
    else if (err === "google_not_configured") setError("Google sign-in is not set up yet. Please use username/password.");
    else if (err === "google_token_failed") setError("Google authentication failed. Please try again or use username/password.");
    else if (err) setError("Google sign-in failed. Please try again.");
  }, []);

  // Login fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Registration fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("student");

  // Redirect if already logged in
  if (user) {
    setLocation("/dashboard");
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (isLogin) {
      login({ username, password }, {
        onError: (error) => {
          setError(error instanceof Error ? error.message : "Login failed");
        },
      });
    } else {
      if (regPassword !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      register({
        username: regUsername,
        password: regPassword,
        firstName,
        lastName,
        email,
        organization,
        name: `${firstName} ${lastName}`,
        role,
      }, {
        onError: (error) => {
          setError(error instanceof Error ? error.message : "Registration failed");
        },
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 dark:bg-[#0d0f1a]/80 backdrop-blur-xl border-b border-black/8 dark:border-white/8 shadow-sm"
          : "bg-transparent"
      }`}>
        <div className="flex justify-center px-5 h-16">
          <div className="w-full max-w-7xl flex items-center gap-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-0.5 shrink-0">
              <img src="/ojtask-logo.png" className="h-10 w-auto object-contain mt-1" alt="OJTask logo" />
            </Link>

            <div className="flex-1" />

            {/* Back to Home */}
            <Link href="/">
              <Button variant="ghost" size="sm" className="font-medium text-muted-foreground hover:text-foreground">
                ← Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <div className="flex items-center justify-center min-h-screen pt-16 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <img src="/ojtask-logo.png" className="h-16 w-auto object-contain mb-2" alt="OJTask logo" />
          <p className="text-muted-foreground mt-2 text-sm">Your internship, organized and on track.</p>
        </div>

        <Card className="border-border/50 shadow-lg shadow-black/5 backdrop-blur-sm bg-card/95">
          {/* Tab Selection */}
          <CardHeader className="pb-3">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => {
                  setIsLogin(true);
                  setError(null);
                }}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  isLogin
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setIsLogin(false);
                  setError(null);
                }}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  !isLogin
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Sign Up
              </button>
            </div>
            <CardTitle>{isLogin ? "Welcome back" : "Create your account"}</CardTitle>
            <CardDescription>
              {isLogin
                ? "Sign in to your account to continue"
                : "Join OJTask to manage your internship efficiently"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 dark:text-red-200 font-medium">{error}</p>
                </div>
              )}
              {isLogin ? (
                // Login Form
                <>
                  <div className="space-y-2">
                    <Label htmlFor="login-username">Username</Label>
                    <Input
                      id="login-username"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="bg-background"
                      placeholder="Enter your username"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">Password</Label>
                      <button
                        type="button"
                        onClick={() => setLocation("/forgot-password")}
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-background pr-10"
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90" 
                    disabled={isLoginPending}
                  >
                    {isLoginPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>

                  {googleStatus && (
                    <>
                      <div className="relative my-1">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">or</span>
                        </div>
                      </div>

                      {googleStatus.enabled ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full gap-2"
                          onClick={() => { window.location.href = "/api/auth/google"; }}
                        >
                          <GoogleIcon />
                          Continue with Google
                        </Button>
                      ) : (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-md border border-dashed border-border text-muted-foreground text-sm cursor-default select-none">
                                <GoogleIcon />
                                <span>Continue with Google</span>
                                <Info className="w-3.5 h-3.5 ml-auto opacity-60" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-xs text-xs">
                              <p className="font-semibold mb-1">Google sign-in not configured</p>
                              <p>Add <code className="bg-muted px-1 rounded">GOOGLE_CLIENT_ID</code> and <code className="bg-muted px-1 rounded">GOOGLE_CLIENT_SECRET</code> to your environment variables.</p>
                              <p className="mt-1 text-muted-foreground break-all">Callback URL: <span className="text-foreground">{googleStatus.callbackUrl}</span></p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </>
                  )}
                </>
              ) : (
                // Registration Form
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="bg-background"
                        placeholder="John"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="bg-background"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-background"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="organization">Organization / School</Label>
                    <Input
                      id="organization"
                      required
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      className="bg-background"
                      placeholder="Your school or company"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student / Trainee</SelectItem>
                        <SelectItem value="supervisor">Supervisor / Mentor</SelectItem>
                        <SelectItem value="school">School Coordinator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      className="bg-background"
                      placeholder="Choose a username"
                    />
                    <p className="text-xs text-muted-foreground">
                      3-20 characters, letters and numbers only
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="reg-password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="bg-background pr-10"
                        placeholder="Create a strong password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {regPassword && <PasswordStrengthIndicator password={regPassword} />}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="bg-background pr-10"
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      {confirmPassword && (
                        <div className="mt-2 flex items-center gap-2">
                          {regPassword === confirmPassword ? (
                            <>
                              <Check className="w-4 h-4 text-green-500" />
                              <span className="text-xs text-green-600 dark:text-green-400">Passwords match</span>
                            </>
                          ) : (
                            <>
                              <X className="w-4 h-4 text-red-500" />
                              <span className="text-xs text-red-600 dark:text-red-400">Passwords don't match</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-xs text-blue-900 dark:text-blue-200">
                    <p className="font-semibold mb-2">Security Tips:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Use at least 8 characters</li>
                      <li>• Mix uppercase, lowercase, numbers, and symbols</li>
                      <li>• Never reuse passwords</li>
                      <li>• Enable 2FA on your account (in settings)</li>
                    </ul>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={isRegisterPending || regPassword !== confirmPassword}
                  >
                    {isRegisterPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>

                  {googleStatus && (
                    <>
                      <div className="relative my-1">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">or</span>
                        </div>
                      </div>

                      {googleStatus.enabled ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full gap-2"
                          onClick={() => { window.location.href = "/api/auth/google"; }}
                        >
                          <GoogleIcon />
                          Sign up with Google
                        </Button>
                      ) : (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-md border border-dashed border-border text-muted-foreground text-sm cursor-default select-none">
                                <GoogleIcon />
                                <span>Sign up with Google</span>
                                <Info className="w-3.5 h-3.5 ml-auto opacity-60" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-xs text-xs">
                              <p className="font-semibold mb-1">Google sign-in not configured</p>
                              <p>Add <code className="bg-muted px-1 rounded">GOOGLE_CLIENT_ID</code> and <code className="bg-muted px-1 rounded">GOOGLE_CLIENT_SECRET</code> to your environment variables.</p>
                              <p className="mt-1 text-muted-foreground break-all">Callback URL: <span className="text-foreground">{googleStatus.callbackUrl}</span></p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </>
                  )}
                </>
              )}

              <p className="text-center text-xs text-muted-foreground mt-4">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setUsername("");
                    setPassword("");
                    setFirstName("");
                    setLastName("");
                    setEmail("");
                    setOrganization("");
                    setRegUsername("");
                    setRegPassword("");
                    setConfirmPassword("");
                  }}
                  className="text-primary hover:underline font-semibold"
                >
                  {isLogin ? "Sign Up" : "Sign In"}
                </button>
              </p>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
      </div>
    </div>
  );
}
