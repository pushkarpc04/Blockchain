"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { getUserDocumentsAction } from "@/server/actions/document.actions";
import type { RegisteredDocument } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, FilePlus, Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ROUTES } from "@/lib/constants";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [documents, setDocuments] = useState<RegisteredDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push(ROUTES.LOGIN);
      return;
    }

    async function fetchDocuments() {
      setLoading(true);
      setError(null);
      const result = await getUserDocumentsAction();
      if (result.success && result.documents) {
        setDocuments(result.documents);
      } else {
        setError(result.error || "Failed to load documents.");
      }
      setLoading(false);
    }

    fetchDocuments();
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading your documents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-12 text-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-destructive text-lg font-semibold">Error Loading Documents</p>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Your Registered Documents</h1>
        <Button asChild>
          <Link href={ROUTES.REGISTER_DOCUMENT}>
            <FilePlus className="mr-2 h-4 w-4" /> Register New Document
          </Link>
        </Button>
      </div>

      {documents.length === 0 ? (
        <Card className="text-center shadow-md">
          <CardHeader>
            <CardTitle>No Documents Found</CardTitle>
            <CardDescription>You haven&apos;t registered any documents yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Click the button above to register your first document and secure it on the blockchain.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg">
          <CardContent className="p-0"> {/* Remove padding for full-width table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Name</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="hidden lg:table-cell">Issued On</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.documentName || doc.fileName}</TableCell>
                    <TableCell className="hidden md:table-cell">{doc.documentType}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {format(new Date(doc.dateOfIssue), "PPP")}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={doc.blockchainTransactionId ? "default" : "secondary"} className={doc.blockchainTransactionId ? "bg-green-500 hover:bg-green-600 text-white" : ""}>
                        {doc.blockchainTransactionId ? "Registered" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild title="View Details">
                        <Link href={`${ROUTES.VERIFY_DOCUMENT}?id=${doc.id}`}>
                          <Eye className="h-5 w-5 text-primary" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
