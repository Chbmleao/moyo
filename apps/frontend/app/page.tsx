export default function HomePage() {
  return (
    <main className="min-h-[calc(100vh-4rem)] px-6 py-16 lg:px-12">
      <div className="mx-auto flex max-w-3xl flex-col gap-10 text-balance">
        <span className="inline-flex w-fit items-center rounded-full bg-primary-light/40 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          cuidado que acolhe
        </span>

        <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">
          Moyo conecta profissionais e pacientes com assinaturas digitais
          acolhedoras.
        </h1>

        <p className="text-lg text-muted-foreground">
          Uma plataforma pensada para a rotina de psicólogas e psicólogos:
          organize documentos, compartilhe termos com segurança e acompanhe cada
          assinatura sem perder o toque humano.
        </p>

        <div className="flex flex-wrap gap-4">
          <button className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90">
            Criar conta profissional
          </button>
          <button className="rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary">
            Conhecer a jornada do paciente
          </button>
        </div>
      </div>
    </main>
  );
}
