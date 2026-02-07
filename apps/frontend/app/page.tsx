import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero: gradient background + soft blobs */}
      <section
        className="relative min-h-[calc(100vh-6rem)] overflow-hidden px-6 py-16 lg:px-12"
        aria-label="Apresentação"
      >
        {/* Gradient background */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(ellipse 80% 70% at 50% 20%, hsl(var(--primary-light) / 0.5), transparent 50%), radial-gradient(ellipse 60% 50% at 80% 60%, hsl(var(--hero-glow) / 0.15), transparent 45%), linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--primary-light) / 0.12) 100%)',
          }}
        />

        {/* Blob shapes - soft organic motion */}
        <div
          className="motion-blob absolute -z-[5] h-[420px] w-[420px] rounded-[60%_40%_50%_60%] bg-primary-light/30 blur-3xl"
          style={{
            top: '-10%',
            right: '-5%',
            animation: 'blob-float 12s ease-in-out infinite',
          }}
        />
        <div
          className="motion-blob absolute -z-[5] h-[320px] w-[320px] rounded-[40%_60%_60%_40%] bg-primary/20 blur-3xl"
          style={{
            bottom: '10%',
            left: '-8%',
            animation: 'blob-float 15s ease-in-out infinite 1s',
          }}
        />
        <div
          className="motion-glow absolute -z-[5] h-[280px] w-[280px] rounded-full bg-primary/15 blur-3xl"
          style={{
            top: '40%',
            left: '50%',
            transform: 'translateX(-50%)',
            animation: 'glow-breathe 10s ease-in-out infinite',
          }}
        />

        {/* Hero content - high contrast, large type */}
        <div className="relative mx-auto flex max-w-3xl flex-col gap-8 text-balance">
          <span
            className="inline-flex w-fit items-center rounded-full bg-primary/15 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-foreground"
            style={{ fontSize: '1rem' }}
          >
            cuidado que acolhe
          </span>

          <h1 className="text-4xl font-semibold leading-tight text-foreground sm:text-5xl lg:text-[2.75rem]">
            Moyo: documentos e assinaturas com simplicidade e segurança
          </h1>

          <p className="max-w-2xl text-xl text-muted-foreground" style={{ fontSize: '1.25rem' }}>
            Uma plataforma para profissionais de saúde mental e seus pacientes: organize termos,
            compartilhe com segurança e acompanhe assinaturas sem perder o toque humano.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/signup"
              className="inline-flex min-h-[48px] min-w-[44px] items-center justify-center rounded-full bg-primary px-8 py-4 text-base font-medium text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              Criar conta profissional
            </Link>
            <Link
              href="#path-cards"
              className="inline-flex min-h-[48px] min-w-[44px] items-center justify-center rounded-full border-2 border-border px-8 py-4 text-base font-medium text-foreground transition hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              Conhecer a jornada do paciente
            </Link>
          </div>
        </div>
      </section>

      {/* Two-path cards: clear choice for professionals vs patients */}
      <section
        id="path-cards"
        className="relative border-t border-border bg-background px-6 py-16 lg:px-12"
        aria-labelledby="path-cards-heading"
      >
        <h2 id="path-cards-heading" className="sr-only">
          Escolha como deseja usar o Moyo
        </h2>
        <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2">
          <Link
            href="/signup"
            className="group flex min-h-[120px] flex-col justify-between rounded-2xl border-2 border-border bg-card p-6 shadow-sm transition hover:border-primary hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <span className="text-lg font-semibold text-foreground">
              Sou profissional de saúde
            </span>
            <p className="text-muted-foreground" style={{ fontSize: '1.125rem' }}>
              Crie sua conta, envie documentos e gerencie assinaturas dos seus pacientes.
            </p>
            <span className="mt-2 inline-flex items-center gap-1 text-base font-medium text-primary">
              Criar conta
              <span aria-hidden>→</span>
            </span>
          </Link>
          <Link
            href="/login"
            className="group flex min-h-[120px] flex-col justify-between rounded-2xl border-2 border-border bg-card p-6 shadow-sm transition hover:border-primary hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <span className="text-lg font-semibold text-foreground">Sou paciente</span>
            <p className="text-muted-foreground" style={{ fontSize: '1.125rem' }}>
              Acesse o link enviado pelo seu profissional para ler e assinar documentos.
            </p>
            <span className="mt-2 inline-flex items-center gap-1 text-base font-medium text-primary">
              Entrar
              <span aria-hidden>→</span>
            </span>
          </Link>
        </div>
      </section>

      {/* Trust line + optional help */}
      <section
        className="border-t border-border bg-muted/30 px-6 py-8 lg:px-12"
        aria-label="Segurança e suporte"
      >
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-base text-muted-foreground" style={{ fontSize: '1.125rem' }}>
            Seus dados e assinaturas com segurança e privacidade.
          </p>
          <Link
            href="#"
            className="min-h-[44px] min-w-[44px] shrink-0 text-base font-medium text-primary underline underline-offset-2 hover:text-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            Precisa de ajuda?
          </Link>
        </div>
      </section>
    </main>
  );
}
