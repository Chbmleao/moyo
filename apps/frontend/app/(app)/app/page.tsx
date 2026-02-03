import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function AppHomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-[calc(100vh-4rem)] px-6 py-16 lg:px-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold text-foreground">
          Área restrita
        </h1>
        <p className="mt-2 text-muted-foreground">
          Olá, {user?.email ?? 'usuário'}. Você está autenticado.
        </p>
      </div>
    </main>
  );
}
