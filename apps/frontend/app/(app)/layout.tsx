import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { PageTransition } from '@/components/page-transition';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <>
      <div className="mx-auto max-w-6xl px-6 pt-4 lg:px-12">
        <Breadcrumbs />
      </div>
      <PageTransition>
        {children}
      </PageTransition>
    </>
  );
}
