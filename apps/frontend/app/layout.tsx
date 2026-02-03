import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Moyo',
  description:
    'Centralize documentos clínicos e simplifique a coleta de assinaturas digitais para profissionais de saúde mental.',
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
