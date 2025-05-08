import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, UploadCloud, FileSearch, Users } from 'lucide-react';
import { APP_NAME, ROUTES } from '@/lib/constants';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="flex flex-col items-center space-y-12">
      <section className="text-center py-16 md:py-24">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-primary">
          Welcome to {APP_NAME}
        </h1>
        <p className="mt-4 text-lg md:text-xl text-foreground max-w-2xl mx-auto">
          Securely register and verify your important documents using the power of blockchain technology.
          Ensure authenticity and build trust with verifiable records.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <Button size="lg" asChild>
            <Link href={ROUTES.REGISTER_DOCUMENT}>
              <UploadCloud className="mr-2 h-5 w-5" /> Register Document
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href={ROUTES.VERIFY_DOCUMENT}>
              <FileSearch className="mr-2 h-5 w-5" /> Verify Document
            </Link>
          </Button>
        </div>
      </section>

      <section className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-8">
        <FeatureCard
          icon={<CheckCircle className="h-10 w-10 text-accent" />}
          title="Immutable Verification"
          description="Leverage blockchain for tamper-proof document registration and verification."
        />
        <FeatureCard
          icon={<UploadCloud className="h-10 w-10 text-accent" />}
          title="Easy Document Upload"
          description="Quickly upload your documents and associated metadata for registration."
        />
        <FeatureCard
          icon={<Users className="h-10 w-10 text-accent" />}
          title="User-Friendly Dashboard"
          description="Manage your registered documents and track verification status with ease."
        />
      </section>

      <section className="w-full max-w-5xl py-16">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl text-center text-primary">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 md:space-y-0 md:grid md:grid-cols-2 md:gap-12 items-center">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-primary flex items-center">
                  <span className="bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center mr-3">1</span>
                  Upload & Describe
                </h3>
                <p className="text-muted-foreground ml-11">
                  Upload your document and provide key metadata like document type, issuing authority, and unique ID.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-primary flex items-center">
                  <span className="bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center mr-3">2</span>
                  Blockchain Registration
                </h3>
                <p className="text-muted-foreground ml-11">
                  We generate a unique cryptographic hash of your document and register it on the blockchain, creating an immutable record.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-primary flex items-center">
                  <span className="bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center mr-3">3</span>
                  Verify Authenticity
                </h3>
                <p className="text-muted-foreground ml-11">
                  Anyone can verify a document by uploading it or entering its ID. We check its hash against the blockchain record.
                </p>
              </div>
            </div>
            <div className="relative h-64 md:h-96 rounded-lg overflow-hidden shadow-md">
              <Image
                src="https://picsum.photos/800/600"
                alt="Secure document flow"
                layout="fill"
                objectFit="cover"
                data-ai-hint="blockchain security"
              />
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <Card className="text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="items-center">
        {icon}
        <CardTitle className="mt-4 text-2xl text-primary">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  );
}
