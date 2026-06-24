import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, whileInView, viewport, transition, ...props }) => (
      <div {...props}>{children}</div>
    )
  }
}));

test('renders contact form', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /contact/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
});
