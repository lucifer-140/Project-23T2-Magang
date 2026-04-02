import type { Metadata } from 'next';
import { Source_Sans_3, Playfair_Display } from 'next/font/google';
import './globals.css';

const sourceSans = Source_Sans_3({ subsets: ['latin'], variable: '--font-source-sans' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

export const metadata: Metadata = {
  title: 'Portal Akademik UPH',
  description: 'Sistem Administrasi Dosen UPH',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${sourceSans.variable} ${playfair.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}
