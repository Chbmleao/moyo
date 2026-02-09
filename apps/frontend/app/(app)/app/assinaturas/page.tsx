import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function AssinaturasPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = (user?.user_metadata?.role as string | undefined) ?? 'patient';
  if (role === 'professional') {
    redirect('/app');
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] px-6 py-16 lg:px-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold text-foreground">
          Documentos para assinar
        </h1>
        <p className="mt-2 text-muted-foreground">
          Olá, {user?.email ?? 'usuário'}. Aqui aparecerão os documentos que seu
          profissional enviar para você assinar.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Nenhum documento pendente no momento.
        </p>
      </div>
    </main>
  );
}
