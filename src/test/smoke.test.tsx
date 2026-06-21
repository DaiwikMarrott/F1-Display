import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

function SmokeFixture() {
  return <div role="status">Validation tooling ready</div>;
}

describe('test foundation', () => {
  it('renders a React component in jsdom', () => {
    render(<SmokeFixture />);

    expect(screen.getByRole('status')).toHaveTextContent('Validation tooling ready');
  });
});
