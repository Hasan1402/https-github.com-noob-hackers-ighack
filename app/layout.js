import './globals.css'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata = {
  title: 'ТИС КІС - Інформаційна Система',
  description: 'Комплексна інформаційна система для управління освітніми процесами',
}

export default function RootLayout({ children }) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}