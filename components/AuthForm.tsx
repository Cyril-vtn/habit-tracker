"use client";

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
import {
  LoginInput,
  loginSchema,
  SignUpInput,
  signUpSchema,
} from "@/lib/validations/auth";
import { AuthError } from "@supabase/supabase-js";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { LanguageSelector } from "@/components/LanguageSelector";

interface AuthFormProps {
  isSignUp?: boolean;
}

export default function AuthForm({ isSignUp = false }: AuthFormProps) {
  const { t, language, setLanguage } = useLanguage();
  const form = useForm<LoginInput | SignUpInput>({
    resolver: zodResolver(isSignUp ? signUpSchema : loginSchema),
    defaultValues: {
      email: "",
      password: "",
      ...(isSignUp && { confirmPassword: "" }),
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();
  const handleSubmit = async (data: LoginInput | SignUpInput) => {
    setIsLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            emailRedirectTo: `${location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        router.push("/login?message=Check your email to confirm your account");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        if (error) throw error;
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      setError((error as AuthError).message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageChange = (value: "en" | "zh") => {
    setLanguage(value);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>
          {t(`auth.title.${isSignUp ? "signup" : "login"}`)}
        </CardTitle>
        <CardDescription>
          {t(`auth.description.${isSignUp ? "signup" : "login"}`)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <LanguageSelector className="mb-4" />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auth.email")}</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auth.password")}</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isSignUp && (
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("auth.confirmPassword")}</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {error && <div className="text-sm text-red-500 mt-2">{error}</div>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignUp ? t("auth.signup") : t("auth.login")}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Link
          href={isSignUp ? "/login" : "/signup"}
          className="text-sm text-muted-foreground hover:underline"
        >
          {isSignUp ? t("auth.switchToLogin") : t("auth.switchToSignup")}
        </Link>
      </CardFooter>
    </Card>
  );
}
