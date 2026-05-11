import { render, screen } from '@testing-library/react'
import Home from './page'
import { expect, test } from 'vitest'

test('Home page renders landing hero', () => {
  render(<Home />)
  // New landing page uses this badge text
  expect(screen.getByText(/Full IM Studio/i)).toBeInTheDocument()
})

