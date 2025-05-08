"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { registerDocumentAction } from "@/server/actions/document.actions";
import type { DocumentUploadPayload } from "@/types";
import { DOCUMENT_TYPES, ROUTES } from "@/lib/constants";
import { useAuth } from "@/providers/AuthProvider";
import { Loader2, UploadCloud, AlertCircle } from "lucide-react";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

const registerDocumentSchema = z.object({
  documentName: z.string().min(3, { message: "Document name must be at least 3 characters." }),
  documentType: z.string().min(1, { message: "Please select a document type." }),
  issuingAuthority: z.string().min(2, { message: "Issuing authority is required." }),
  dateOfIssue: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date format." }),
  uniqueId: z.string().min(1, { message: "A unique ID for the document is required." }),
  file: z
    .custom<FileList>((val) => val instanceof FileList && val.length > 0, "Please select a file.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (files) => ACCEPTED_FILE_TYPES.includes(files?.[0]?.type),
      "Only .pdf, .jpg, .png, .webp files are accepted."
    ),
});

type RegisterDocumentFormValues = z.infer<typeof registerDocumentSchema>;

export default function RegisterDocumentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RegisterDocumentFormValues>({
    resolver: zodResolver(registerDocumentSchema),
    defaultValues: {
      documentName: "",
      documentType: "",
      issuingAuthority: "",
      dateOfIssue: "",
      uniqueId: "",
      file: undefined,
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(ROUTES.LOGIN + `?redirect=${ROUTES.REGISTER_DOCUMENT}`);
    }
  }, [user, authLoading, router]);

  const onSubmit = async (data: RegisterDocumentFormValues) => {
    setIsSubmitting(true);
    if (!data.file || data.file.length === 0) {
      toast({ title: "File Error", description: "No file selected.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    const fileToUpload = data.file[0];

    const payload: DocumentUploadPayload = {
      documentName: data.documentName,
      documentType: data.documentType,
      issuingAuthority: data.issuingAuthority,
      dateOfIssue: data.dateOfIssue, // Ensure this is correctly formatted if your backend expects a specific date type
      uniqueId: data.uniqueId,
      file: fileToUpload,
    };

    const result = await registerDocumentAction(payload);

    if (result.success) {
      toast({
        title: "Document Registration Initiated",
        description: "Your document is being processed and registered on the blockchain.",
      });
      router.push(ROUTES.DASHBOARD);
    } else {
      toast({
        title: "Registration Failed",
        description: result.error || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[calc(100vh-theme(spacing.32))] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
     // This case should ideally be handled by middleware or the useEffect redirect.
     // Adding a fallback message.
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-12 text-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-destructive text-lg font-semibold">Access Denied</p>
        <p className="text-muted-foreground">You must be logged in to register a document.</p>
        <Button asChild><Link href={ROUTES.LOGIN}>Login</Link></Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">Register New Document</CardTitle>
          <CardDescription>Fill in the details and upload your document to secure it on the blockchain.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="documentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., My University Diploma" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="documentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a document type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DOCUMENT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="issuingAuthority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issuing Authority</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., University of Example, Government Office" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateOfIssue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Issue</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="uniqueId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document's Unique ID / Serial Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter any unique identifier from the document" {...field} />
                    </FormControl>
                    <FormDescription>
                      This could be a serial number, certificate ID, etc.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="file"
                render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem>
                    <FormLabel>Document File</FormLabel>
                    <FormControl>
                       <Input 
                          type="file" 
                          accept={ACCEPTED_FILE_TYPES.join(",")}
                          onChange={(e) => onChange(e.target.files)}
                          {...rest} 
                        />
                    </FormControl>
                     <FormDescription>
                      Max 5MB. Accepted: PDF, JPG, PNG, WEBP.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UploadCloud className="mr-2 h-4 w-4" />
                )}
                Register Document
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
