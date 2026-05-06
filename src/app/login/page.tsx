import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      {/* Glow effect */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <Card className="relative w-full max-w-sm border-border bg-card shadow-2xl">
        <CardHeader className="pb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/30">
            <span className="text-xl font-black tracking-tight text-white">WM</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">White Medina</h1>
          <p className="text-sm text-muted-foreground">Accès membres uniquement</p>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
