'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  listDocuments,
  getDocument,
  type DocumentItem,
} from '@/lib/api/documents';

export default function AssinaturasPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        router.replace('/login');
        return;
      }
      const role = session.user?.user_metadata?.role ?? 'patient';
      if (role === 'professional') {
        router.replace('/app');
        return;
      }
      try {
        const list = await listDocuments(session.access_token);
        if (!cancelled) setDocuments(list);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Erro ao carregar');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase.auth, router]);

  async function handleView(id: string) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    try {
      const { viewUrl } = await getDocument(id, session.access_token);
      window.open(viewUrl, '_blank');
    } catch {
      setError('Não foi possível abrir o documento.');
    }
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] px-6 py-16 lg:px-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold text-foreground">
          Documentos para assinar
        </h1>
        <p className="mt-2 text-muted-foreground">
          Documentos que seu profissional enviou para você assinar.
        </p>

        {loading ? (
          <p className="mt-6 text-muted-foreground">Carregando…</p>
        ) : error ? (
          <p className="mt-6 text-destructive">{error}</p>
        ) : documents.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">
            Nenhum documento pendente no momento.
          </p>
        ) : (
          <ul className="mt-6 space-y-3">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card p-4"
              >
                <div>
                  <p className="font-medium text-foreground">{doc.fileName}</p>
                  <p className="text-sm text-muted-foreground">
                    {doc.deadlineAt
                      ? `Prazo: ${new Date(doc.deadlineAt).toLocaleDateString('pt-BR')}`
                      : 'Sem prazo'}
                    {` · ${doc.status === 'signed' ? 'Assinado' : 'Pendente'}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleView(doc.id)}
                  className="min-h-[44px] min-w-[44px] rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  Abrir
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
