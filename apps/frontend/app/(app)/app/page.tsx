import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { FileText, Clock, CheckCircle, Upload, User, Users } from 'lucide-react';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default async function AppHomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = (user?.user_metadata?.role as string | undefined) ?? 'patient';
  const userName = (user?.user_metadata?.name as string | undefined) ?? null;
  if (role !== 'professional') {
    redirect('/app/assinaturas');
  }

  const displayName = userName?.trim() || user?.email?.split('@')[0] || 'profissional';

  return (
    <main className="min-h-[calc(100vh-4rem)] px-6 py-10 lg:px-12">
      <div className="mx-auto max-w-4xl">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">
            {getGreeting()}, {displayName}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Aqui está um resumo da sua conta.
          </p>
        </div>

        {/* Stats cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Total de documentos</p>
            <p className="mt-1 text-2xl font-bold text-foreground">—</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <Clock className="h-5 w-5 text-accent" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
            <p className="mt-1 text-2xl font-bold text-foreground">—</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <CheckCircle className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Assinados</p>
            <p className="mt-1 text-2xl font-bold text-foreground">—</p>
          </div>
        </div>

        {/* Quick actions */}
        <h2 className="mb-4 text-lg font-medium text-foreground">Ações rápidas</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Link
            href="/app/documentos"
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-md"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-foreground">Documentos</p>
              <p className="text-sm text-muted-foreground">Enviar e gerar links de assinatura</p>
            </div>
          </Link>
          <Link
            href="/app/pacientes"
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-md"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-foreground">Pacientes</p>
              <p className="text-sm text-muted-foreground">Cadastrar e gerenciar seus pacientes</p>
            </div>
          </Link>
          <Link
            href="/app/perfil"
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-md"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-foreground">Meu perfil</p>
              <p className="text-sm text-muted-foreground">Editar foto e dados da conta</p>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}