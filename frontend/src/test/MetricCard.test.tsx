import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MetricCard } from '../components/common/MetricCard';

describe('MetricCard Component', () => {
  it('renders title, value, subtitle, and badge text', () => {
    render(
      <MetricCard
        title="Total Rows"
        value="502"
        subtitle="Records loaded from CSV"
        badge={{ text: 'Ready', type: 'success' }}
      />
    );

    expect(screen.getByText('Total Rows')).toBeInTheDocument();
    expect(screen.getByText('502')).toBeInTheDocument();
    expect(screen.getByText('Records loaded from CSV')).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });
});
