'use client'

import { useId } from 'react'

export function GoldMedalIcon({ className = 'h-4 w-4' }: { className?: string }) {
  const gradientId = useId()
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
          <stop offset="50%" stopColor="#FFA500" stopOpacity="1" />
          <stop offset="100%" stopColor="#FF8C00" stopOpacity="1" />
        </linearGradient>
      </defs>
      <path
        d="M16 2L20 12H28L21 18L24 28L16 22L8 28L11 18L4 12H12L16 2Z"
        fill={`url(#${gradientId})`}
        stroke="#FFA500"
        strokeWidth="0.5"
      />
      <circle cx="16" cy="16" r="4" fill="#FFD700" opacity="0.3" />
    </svg>
  )
}

export function SilverMedalIcon({ className = 'h-4 w-4' }: { className?: string }) {
  const gradientId = useId()
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E8E8E8" stopOpacity="1" />
          <stop offset="50%" stopColor="#C0C0C0" stopOpacity="1" />
          <stop offset="100%" stopColor="#A8A8A8" stopOpacity="1" />
        </linearGradient>
      </defs>
      <path
        d="M16 2L20 12H28L21 18L24 28L16 22L8 28L11 18L4 12H12L16 2Z"
        fill={`url(#${gradientId})`}
        stroke="#C0C0C0"
        strokeWidth="0.5"
      />
      <circle cx="16" cy="16" r="4" fill="#E8E8E8" opacity="0.3" />
    </svg>
  )
}

export function BronzeMedalIcon({ className = 'h-4 w-4' }: { className?: string }) {
  const gradientId = useId()
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#CD7F32" stopOpacity="1" />
          <stop offset="50%" stopColor="#B87333" stopOpacity="1" />
          <stop offset="100%" stopColor="#8B4513" stopOpacity="1" />
        </linearGradient>
      </defs>
      <path
        d="M16 2L20 12H28L21 18L24 28L16 22L8 28L11 18L4 12H12L16 2Z"
        fill={`url(#${gradientId})`}
        stroke="#B87333"
        strokeWidth="0.5"
      />
      <circle cx="16" cy="16" r="4" fill="#CD7F32" opacity="0.3" />
    </svg>
  )
}
