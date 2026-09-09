import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Testing Library only registers its own auto-cleanup when Vitest runs with `globals: true`, which
// this config does not. Without this the DOM accumulates across tests in a file and getBy* starts
// finding matches from an earlier render.
afterEach(cleanup)
