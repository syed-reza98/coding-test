import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Navbar } from '@/components/Navbar';

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 2, name: 'Staff Member', email: 'staff@example.com', role: 'staff' },
    isAdmin: false,
    isStaff: true,
  }),
}));

describe('Navbar Component', () => {
  it('renders title, subtitle, staff permission warning, and storefront link', () => {
    render(<Navbar title="Products Inventory" subtitle="Manage catalogue" />);

    expect(screen.getByText('Products Inventory')).toBeInTheDocument();
    expect(screen.getByText('Manage catalogue')).toBeInTheDocument();
    expect(screen.getByText(/Staff Permissions/i)).toBeInTheDocument();
    expect(screen.getByText('staff@example.com')).toBeInTheDocument();
    expect(screen.getByText('Storefront')).toBeInTheDocument();
  });
});
