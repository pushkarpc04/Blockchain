"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { verifyDocumentByFileAction, verifyDocumentByIdAction } from "@/server/actions/document.actions";
import type { VerificationResult, RegisteredDocument } from "@/types";
import { Loader2, CheckCircle, XCircle, FileSearch, ShieldCheck, AlertTriangle, CalendarDays, Landmark, UserCircle, Hash, Fingerprint } from "lucide-react";
import { format } from "date-fns";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

const verifyByFileSchema = z.object({
  file: z
    .custom<FileList>((val) => val instanceof FileList && val.length > 0, "Please select a file.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (files) => ACCEPTED_FILE_TYPES.includes(files?.[0]?.type),
      "Only .pdf, .jpg, .png, .webp files are accepted."
    ),
});
type VerifyByFileFormValues = z.infer<typeof verifyByFileSchema>;

const verifyByIdSchema = z.object({
  documentId: z.string().min(5, { message: "Document ID must be valid." }), // Assuming Firestore IDs are longer
});
type VerifyByIdFormValues = z.infer<typeof verifyByIdSchema>;

function VerifyDocumentContent() {
  const searchParams = useSearchParams();
  const routerDocumentId = searchParams.get('id');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(routerDocumentId ? "byId" : "byFile");

  const fileForm = useForm<VerifyByFileFormValues>({
    resolver: zodResolver(verifyByFileSchema),
  });

  const idForm = useForm<VerifyByIdFormValues>({
    resolver: zodResolver(verifyByIdSchema),
    defaultValues: {
      documentId: routerDocumentId || "",
    }
  });

  useEffect(() => {
    if (routerDocumentId) {
      setActiveTab("byId");
      idForm.setValue("documentId", routerDocumentId);
      // Optionally auto-submit if ID is present
      // handleVerifyById({ documentId: routerDocumentId });
    }
  }, [routerDocumentId, idForm]);


  const handleVerifyByFile = async (data: VerifyByFileFormValues) => {
    setIsSubmitting(true);
    setVerificationResult(null);
    if (!data.file || data.file.length === 0) {
      toast({ title: "File Error", description: "No file selected.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    const result = await verifyDocumentByFileAction(data.file[0]);
    setVerificationResult(result);
    setIsSubmitting(false);
  };

  const handleVerifyById = async (data: VerifyByIdFormValues) => {
    setIsSubmitting(true);
    setVerificationResult(null);
    const result = await verifyDocumentByIdAction(data.documentId);
    setVerificationResult(result);
    setIsSubmitting(false);
  };
  
  const renderDocumentDetails = (doc: RegisteredDocument) => (
    <div className="space-y-3 mt-4">
      <h4 className="font-semibold text-lg text-primary">Document Details:</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <DetailItem icon={<Fingerprint />} label="Name" value={doc.documentName || doc.fileName} />
        <DetailItem icon={<Hash />} label="Type" value={doc.documentType} />
        <DetailItem icon={<Landmark />} label="Issuing Authority" value={doc.issuingAuthority} />
        <DetailItem icon={<CalendarDays />} label="Date of Issue" value={format(new Date(doc.dateOfIssue), "PPP")} />
        <DetailItem icon={<Hash />} label="Unique ID" value={doc.uniqueId} />
        {doc.blockchainTransactionId && (
            <DetailItem icon={<ShieldCheck />} label="Blockchain TxID" value={doc.blockchainTransactionId.substring(0,10)+'...'+doc.blockchainTransactionId.substring(doc.blockchainTransactionId.length-8)} isTx={true}/>
        )}
        {doc.registrationTimestamp && (
            <DetailItem icon={<CalendarDays />} label="Registered On" value={format(new Date(doc.registrationTimestamp), "Pp")} />
        )}
        {/* <DetailItem icon={<UserCircle />} label="Registered By (User ID)" value={doc.userId.substring(0,10)+'...'} /> */}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center space-y-8">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">Verify Document Authenticity</CardTitle>
          <CardDescription>Upload a document or enter its ID to check its registration status on the blockchain.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="byFile">Verify by File</TabsTrigger>
              <TabsTrigger value="byId">Verify by ID</TabsTrigger>
            </TabsList>
            <TabsContent value="byFile" className="mt-6">
              <Form {...fileForm}>
                <form onSubmit={fileForm.handleSubmit(handleVerifyByFile)} className="space-y-6">
                  <FormField
                    control={fileForm.control}
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSearch className="mr-2 h-4 w-4" />}
                    Verify Document
                  </Button>
                </form>
              </Form>
            </TabsContent>
            <TabsContent value="byId" className="mt-6">
              <Form {...idForm}>
                <form onSubmit={idForm.handleSubmit(handleVerifyById)} className="space-y-6">
                  <FormField
                    control={idForm.control}
                    name="documentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document ID</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter the document's registration ID" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSearch className="mr-2 h-4 w-4" />}
                    Verify Document
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {verificationResult && (
        <Card className={`w-full max-w-2xl shadow-lg ${verificationResult.found && verificationResult.blockchainStatus?.isVerified ? 'border-green-500' : 'border-red-500'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              {verificationResult.found && verificationResult.blockchainStatus?.isVerified ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : (
                <XCircle className="h-8 w-8 text-red-500" />
              )}
              Verification Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-lg font-medium ${verificationResult.found && verificationResult.blockchainStatus?.isVerified ? 'text-green-600' : 'text-red-600'}`}>
              {verificationResult.message}
            </p>
            {verificationResult.document && renderDocumentDetails(verificationResult.document)}
            
            {verificationResult.blockchainStatus && verificationResult.document && !verificationResult.blockchainStatus.isVerified && (
               <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded-md text-yellow-700">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5"/>
                  <span className="font-semibold">Blockchain Status Note</span>
                </div>
                <p className="text-sm mt-1">This document is in our system but its current blockchain verification status is unconfirmed or has issues. This could be due to various reasons including pending transactions or changes on the blockchain.</p>
               </div>
            )}
          </CardContent>
          {verificationResult.document?.storageUrl && (
            <CardFooter>
              <Button variant="outline" asChild>
                <a href={verificationResult.document.storageUrl} target="_blank" rel="noopener noreferrer">
                  View Stored Document (if available)
                </a>
              </Button>
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  );
}


const DetailItem = ({ icon, label, value, isTx }: { icon: React.ReactNode; label: string; value: string | number; isTx?: boolean }) => (
  <div className="flex items-start space-x-2 p-2 rounded-md bg-muted/30 hover:bg-muted/60 transition-colors">
    <span className="text-accent mt-1">{icon}</span>
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      {isTx ? (
        <p className="font-medium break-all text-primary hover:underline cursor-pointer" title={value.toString()}>
          {/* In real app, this could link to a blockchain explorer */}
          {value}
        </p>
      ) : (
        <p className="font-medium">{value}</p>
      )}
    </div>
  </div>
);

// It's good practice to wrap components that use `useSearchParams` in `<Suspense>`
export default function VerifyDocumentPage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <VerifyDocumentContent />
    </Suspense>
  );
}
