import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Loader2, Eye, EyeOff, Check, X, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

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

export default function AuthPage() {
  const { login, register, isLoginPending, isRegisterPending, user } = useAuth();
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-background p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">OJTask</h1>
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
                    <Label htmlFor="login-password">Password</Label>
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
  );
}
