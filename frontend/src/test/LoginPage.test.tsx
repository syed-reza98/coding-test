import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LoginPage from '@/app/login/page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn(),
  }),
}));

describe('LoginPage Component', () => {
  it('renders login form and quick demo credentials', () => {
    render(<LoginPage />);

    expect(screen.getByText('Sign in to OrderFlow')).toBeInTheDocument();
    expect(screen.getByText('Admin Account')).toBeInTheDocument();
    expect(screen.getByText('Staff Account')).toBeInTheDocument();

    const emailInput = screen.getByPlaceholderText('you@example.com') as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;

    expect(emailInput.value).toBe('');
    expect(passwordInput.value).toBe('');

    // Click quick fill Admin Account
    fireEvent.click(screen.getByText('Admin Account'));
    expect(emailInput.value).toBe('admin@example.com');
    expect(passwordInput.value).toBe('password123');

    // Click quick fill Staff Account
    fireEvent.click(screen.getByText('Staff Account'));
    expect(emailInput.value).toBe('staff@example.com');
    expect(passwordInput.value).toBe('password123');
  });
});
