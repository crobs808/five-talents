import type { Metadata } from 'next';
import '@/globals.css';
import { ClientLayout } from '@/app/client-layout';

export const metadata: Metadata = {
  title: 'Check-In System',
  description: 'Event check-in and check-out system with name tags',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="bg-gray-50 dark:bg-gray-950">
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
