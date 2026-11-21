import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AppProvider } from '../context/AppContext';
import { Navbar } from '../components/common/Navbar';

describe('Navbar Component', () => {
  it('renders brand title and all navigation tabs', () => {
    render(
      <AppProvider>
        <Navbar />
      </AppProvider>
    );

    expect(screen.getByText('AutoML Assistant')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Upload & Preview')).toBeInTheDocument();
    expect(screen.getByText('Quality Report')).toBeInTheDocument();
    expect(screen.getByText('Preprocessing')).toBeInTheDocument();
    expect(screen.getByText('AutoML Hub')).toBeInTheDocument();
    expect(screen.getByText('History & Logs')).toBeInTheDocument();
  });
});
