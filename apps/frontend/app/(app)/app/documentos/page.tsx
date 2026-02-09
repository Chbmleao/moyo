'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  listDocuments,
  uploadDocument,
  getDocument,
  type DocumentItem,
} from '@/lib/api/documents';

export default function DocumentosPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [signerEmail, setSignerEmail] = useState('');
  const [deadline, setDeadline] = useState('');
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
      if (role !== 'professional') {
        router.replace('/app/assinaturas');
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setUploadError('Sessão expirada. Faça login novamente.');
      setUploading(false);
      return;
    }
    try {
      await uploadDocument(
        session.access_token,
        file,
        signerEmail.trim() || null,
        deadline.trim() || null
      );
      const list = await listDocuments(session.access_token);
      setDocuments(list);
      setFile(null);
      setSignerEmail('');
      setDeadline('');
      if (document.getElementById('file-input')) {
        (document.getElementById('file-input') as HTMLInputElement).value = '';
      }
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Erro ao enviar');
    } finally {
      setUploading(false);
    }
  }

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
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">
            Documentos
          </h1>
          <Link
            href="/app"
            className="text-sm font-medium text-primary hover:underline"
          >
            Voltar ao início
          </Link>
        </div>

        <section className="mb-10 rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-medium text-foreground">
            Enviar novo documento (PDF)
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="file-input"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                Arquivo PDF
              </label>
              <input
                id="file-input"
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                required
                className="w-full text-sm text-foreground file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground file:hover:bg-primary/90"
              />
            </div>
            <div>
              <label
                htmlFor="signer_email"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                E-mail do signatário (opcional)
              </label>
              <input
                id="signer_email"
                type="email"
                value={signerEmail}
                onChange={(e) => setSignerEmail(e.target.value)}
                placeholder="paciente@email.com"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label
                htmlFor="deadline"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                Prazo para assinatura (opcional)
              </label>
              <input
                id="deadline"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {uploadError && (
              <p className="text-sm text-destructive" role="alert">
                {uploadError}
              </p>
            )}
            <button
              type="submit"
              disabled={uploading || !file}
              className="min-h-[44px] rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
            >
              {uploading ? 'Enviando…' : 'Enviar documento'}
            </button>
          </form>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-medium text-foreground">
            Meus documentos
          </h2>
          {loading ? (
            <p className="text-muted-foreground">Carregando…</p>
          ) : error ? (
            <p className="text-destructive">{error}</p>
          ) : documents.length === 0 ? (
            <p className="text-muted-foreground">
              Nenhum documento enviado ainda.
            </p>
          ) : (
            <ul className="space-y-3">
              {documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card p-4"
                >
                  <div>
                    <p className="font-medium text-foreground">{doc.fileName}</p>
                    <p className="text-sm text-muted-foreground">
                      {doc.signerEmail
                        ? `Signatário: ${doc.signerEmail}`
                        : 'Sem signatário definido'}
                      {doc.deadlineAt &&
                        ` · Prazo: ${new Date(doc.deadlineAt).toLocaleDateString('pt-BR')}`}
                      {` · ${doc.status === 'signed' ? 'Assinado' : 'Pendente'}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleView(doc.id)}
                    className="min-h-[44px] min-w-[44px] rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    Ver
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
