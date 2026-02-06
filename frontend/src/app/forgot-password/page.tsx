"use client";

import { useState } from "react";
import { apiBaseUrl } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";

export default function ForgotPasswordPage() {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setMessage("");
    setResetUrl("");

    const payload = emailOrUsername.includes("@")
      ? { email: emailOrUsername }
      : { userName: emailOrUsername };

    try {
      const response = await fetch(`${apiBaseUrl}/users/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      setMessage(data.message || "Check your email for a reset link.");
      if (data.resetUrl) {
        setResetUrl(data.resetUrl);
      }
    } catch (error) {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setStatus("done");
    }
  };

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Forgot your password?</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="emailOrUsername">Email or username</FieldLabel>
                <Input
                  id="emailOrUsername"
                  name="emailOrUsername"
                  value={emailOrUsername}
                  onChange={(event) => setEmailOrUsername(event.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </Field>
              <FieldDescription>
                We&apos;ll send a reset link if your account exists.
              </FieldDescription>
              <Button
                type="submit"
                className="w-full"
                disabled={status === "loading"}
              >
                {status === "loading" ? "Sending..." : "Send reset link"}
              </Button>
            </FieldGroup>
          </form>

          {message && (
            <div className="mt-4 text-sm text-muted-foreground">
              <p>{message}</p>
              {resetUrl && (
                <p className="mt-2 break-all">
                  Reset link:{" "}
                  <a className="text-primary underline" href={resetUrl}>
                    {resetUrl}
                  </a>
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
