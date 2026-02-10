import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-background">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Fabrika Eğitim Sistemi</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Hoş geldiniz. Sisteme giriş yapmak için lütfen yönergeleri takip ediniz.
          </p>
          <Button className="w-full" asChild>
            <Link href="/login">Giriş Yap</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
