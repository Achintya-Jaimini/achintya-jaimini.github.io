import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, whileInView, viewport, transition, ...props }) => (
      <div {...props}>{children}</div>
    )
  }
}));

test('renders chess bot section', () => {
  render(<App />);
  const linkElement = screen.getByText(/play timed chess/i);
  expect(linkElement).toBeInTheDocument();
});
