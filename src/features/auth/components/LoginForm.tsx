"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { isRedirectError } from "next/dist/client/components/redirect-error";

import { signInAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DevAuthHint = {
  email: string;
  password: string;
};

type LoginFormProps = {
  devAuthHint?: DevAuthHint | null;
  initialError?: string | null;
};

export function LoginForm({ devAuthHint = null, initialError = null }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(initialError ?? "");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signInAction(email, password);

      if (result && !result.success) {
        setError(result.error);
      }
    } catch (err) {
      if (isRedirectError(err)) {
        return;
      }
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-border/50 bg-card/95 shadow-2xl shadow-brand-navy/10 backdrop-blur-sm">
      <CardHeader className="space-y-2 pb-2 text-center">
        <CardTitle className="text-xl font-semibold tracking-tight">
          Sign in to SHMS
        </CardTitle>
        <CardDescription className="text-sm">
          Enter your staff credentials to continue
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-5 pt-2">
          {error ? (
            <p
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@sedvis-hotel.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="password-field pr-10"
              />
              <button
                type="button"
                className="absolute right-0 top-0 flex h-full w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 pt-2">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
          {devAuthHint ? (
            <p className="text-center text-xs text-muted-foreground">
              Local dev auth (ENABLE_DEV_AUTH):{" "}
              <span className="font-mono text-foreground/80">{devAuthHint.email}</span>{" "}
              /{" "}
              <span className="font-mono text-foreground/80">{devAuthHint.password}</span>
            </p>
          ) : null}
        </CardFooter>
      </form>
    </Card>
  );
}
