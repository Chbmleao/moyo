import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function AppHomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = (user?.user_metadata?.role as string | undefined) ?? 'patient';
  if (role !== 'professional') {
    redirect('/app/assinaturas');
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] px-6 py-16 lg:px-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold text-foreground">
          Área restrita
        </h1>
        <p className="mt-2 text-muted-foreground">
          Olá, {user?.email ?? 'usuário'}. Você está autenticado.
        </p>
        <p className="mt-4">
          <Link
            href="/app/documentos"
            className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            Gerenciar documentos
          </Link>
        </p>
      </div>
    </main>
  );
}
