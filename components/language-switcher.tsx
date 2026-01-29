'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Languages } from 'lucide-react'

const languages = [
  { code: 'en', name: 'English' },
  { code: 'uk', name: 'Українська' },
  { code: 'pl', name: 'Polski' },
  { code: 'be', name: 'Беларуская' },
]

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
    // Initialize from localStorage if available, otherwise use i18n.language
    if (typeof window !== 'undefined') {
      const storedLang = localStorage.getItem('i18nextLng')
        if (storedLang && ['en', 'uk', 'pl', 'be'].includes(storedLang)) {
          return storedLang
        }
    }
    return i18n.language || 'en'
  })

  useEffect(() => {
    // Sync with i18n language on mount and when it changes
    const updateLanguage = () => {
      setCurrentLanguage(i18n.language || 'en')
    }

    // Initial sync
    updateLanguage()

    // Listen for language changes
    i18n.on('languageChanged', updateLanguage)

    return () => {
      i18n.off('languageChanged', updateLanguage)
    }
  }, [i18n])

  const handleLanguageChange = (value: string) => {
    i18n.changeLanguage(value)
    localStorage.setItem('i18nextLng', value)
    setCurrentLanguage(value)
  }

  const currentLanguageData = languages.find((lang) => lang.code === currentLanguage) || languages[0]

  return (
    <Select value={currentLanguage} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-[140px]">
        <div className="flex items-center gap-2">
          <Languages className="h-4 w-4" />
          <SelectValue>
            <span suppressHydrationWarning>{currentLanguageData.name}</span>
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            {lang.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
