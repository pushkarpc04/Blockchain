"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { registerUser } from "@/server/actions/auth.actions";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { useAuth } from "@/providers/AuthProvider";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const registerSchema = z.object({
  displayName: z.string().min(2, { message: "Display name must be at least 2 characters." }).optional(),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!authLoading && user) {
      router.push(ROUTES.DASHBOARD);
    }
  }, [user, authLoading, router]);

  const onSubmit = async (data: RegisterFormValues) => {
    setIsSubmitting(true);
    const formData = new FormData();
    if (data.displayName) formData.append("displayName", data.displayName);
    formData.append("email", data.email);
    formData.append("password", data.password);

    const result = await registerUser(formData);

    if (result.success) {
      toast({
        title: "Registration Successful",
        description: "Welcome! Please check your email for verification if applicable.",
      });
      router.push(ROUTES.DASHBOARD);
      router.refresh();
    } else {
      toast({
        title: "Registration Failed",
        description: result.error || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  };
  
  if (authLoading || (!authLoading && user)) {
    return (
      <div className="flex min-h-[calc(100vh-theme(spacing.32))] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-theme(spacing.32))] items-center justify-center">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Create an Account with {APP_NAME}</CardTitle>
          <CardDescription>Sign up to start securing your documents.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} />
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Register
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="text-center text-sm">
          <p>
            Already have an account?{" "}
            <Button variant="link" asChild className="p-0">
              <Link href={ROUTES.LOGIN}>Login here</Link>
            </Button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
