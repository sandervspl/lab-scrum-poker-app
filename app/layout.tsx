import type React from 'react';
import type { Metadata } from 'next';
import { Red_Hat_Text } from 'next/font/google';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Analytics } from '@vercel/analytics/next';

import './globals.css';

import { Header } from '@/components/header';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { QueryProvider } from '@/lib/react-query-provider';

export const metadata: Metadata = {
  title: 'Scrum Poker by Lab Digital',
  description: 'Estimate story points with your team in real-time',
};

const redHatText = Red_Hat_Text({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-red-hat-text',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {process.env.NODE_ENV !== 'production' && (
          <script async crossOrigin="anonymous" src="https://tweakcn.com/live-preview.min.js" />
        )}
      </head>
      <body className={`${redHatText.variable} font-sans`}>
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Header />
            {children}
          </ThemeProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryProvider>
        <Analytics />
        <Toaster />
      </body>
    </html>
  );
}
