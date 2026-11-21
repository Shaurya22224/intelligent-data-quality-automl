import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { QualityBadge } from '../components/common/QualityBadge';

describe('QualityBadge Component', () => {
  it('renders Excellent grade correctly for high score', () => {
    render(<QualityBadge score={95.5} grade="Excellent" />);
    expect(screen.getByText('Excellent')).toBeInTheDocument();
    expect(screen.getByText('(95.5/100)')).toBeInTheDocument();
  });

  it('infers Poor grade automatically when score is below 60', () => {
    render(<QualityBadge score={45.0} />);
    expect(screen.getByText('Poor')).toBeInTheDocument();
  });

  it('infers Good grade when score is between 75 and 89', () => {
    render(<QualityBadge score={82.0} />);
    expect(screen.getByText('Good')).toBeInTheDocument();
  });
});
