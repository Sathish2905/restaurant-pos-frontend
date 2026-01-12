import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { ThemeProvider } from "@/lib/theme-provider"

import { SettingsProvider } from "@/lib/settings-context"
import { Toaster } from "sonner"

import { api } from "@/lib/api"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export async function generateMetadata(): Promise<Metadata> {
  const settings = await api.getSettings()
  const restaurantName = settings.find((s) => s.key === "restaurant_name")?.value || "Restaurant POS"
  const restaurantDescription = settings.find((s) => s.key === "restaurant_description")?.value || "Modern Restaurant Point of Sale System"

  return {
    title: restaurantName,
    description: restaurantDescription,
    generator: "Sathish2905",
    icons: {
      icon: [
        {
          url: "/restaurant-icon.png",
        },
      ],
      apple: "/restaurant-icon.png",
    },
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider defaultTheme="light">
          <AuthProvider>
            <SettingsProvider>{children}</SettingsProvider>
          </AuthProvider>
        </ThemeProvider>
        <Toaster position="top-right" richColors />
        <Analytics />
      </body>
    </html>
  )
}
