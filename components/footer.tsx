'use client'

import { Facebook, MessageCircle, Send, Mail, MapPin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Contact Information */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Facebook */}
            <a
              href="https://www.facebook.com/vasmarks"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Facebook"
            >
              <Facebook className="h-5 w-5" />
              <span className="hidden sm:inline">Facebook</span>
            </a>

            {/* WhatsApp */}
            <a
              href="https://wa.me/48729282657"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              aria-label="WhatsApp"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="hidden sm:inline">+48 729 282 657</span>
            </a>

            {/* Telegram */}
            <a
              href="https://t.me/markvasil123"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Telegram"
            >
              <Send className="h-5 w-5" />
              <span className="hidden sm:inline">Telegram</span>
            </a>

            {/* Email */}
            <a
              href="mailto:marksvasiljevs22@gmail.com"
              className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Email"
            >
              <Mail className="h-5 w-5" />
              <span className="hidden sm:inline">marksvasiljevs22@gmail.com</span>
            </a>
          </div>

          {/* Location Link */}
          <div className="flex items-center">
            <a
              href="https://montaclub.com.pl/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Location"
            >
              <MapPin className="h-5 w-5" />
              <span>Monta Beach Volley Club</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
