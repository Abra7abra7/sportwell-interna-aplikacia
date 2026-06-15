import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LoginPage from './page';

// Mock `next/navigation`
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() })
}));

// Mock AuthContext
const mockSetAuthEmail = vi.fn();
const mockSetAuthPassword = vi.fn();
const mockHandleAuthSubmit = vi.fn((e) => e.preventDefault());
const mockSetAuthMode = vi.fn();

vi.mock('@/components/providers/AuthProvider', () => ({
  useAuthContext: () => ({
    sessionUser: null,
    authEmail: '',
    setAuthEmail: mockSetAuthEmail,
    authPassword: '',
    setAuthPassword: mockSetAuthPassword,
    authMode: 'login',
    setAuthMode: mockSetAuthMode,
    handleAuthSubmit: mockHandleAuthSubmit,
    isAuthLoading: false
  })
}));

describe('LoginPage', () => {
  it('renders login form correctly', () => {
    render(<LoginPage />);
    expect(screen.getByText('Prihlásenie SportWell')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('vas@email.sk')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Prihlásiť sa/i })).toBeInTheDocument();
  });

  it('allows user to input email and password', () => {
    render(<LoginPage />);
    const emailInput = screen.getByPlaceholderText('vas@email.sk');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    fireEvent.change(emailInput, { target: { value: 'test@sportwell.sk' } });
    expect(mockSetAuthEmail).toHaveBeenCalledWith('test@sportwell.sk');

    fireEvent.change(passwordInput, { target: { value: 'secret' } });
    expect(mockSetAuthPassword).toHaveBeenCalledWith('secret');
  });

  it('submits the form', () => {
    render(<LoginPage />);
    
    // Fill required fields before submitting
    const emailInput = screen.getByPlaceholderText('vas@email.sk');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    fireEvent.change(emailInput, { target: { value: 'test@sportwell.sk' } });
    fireEvent.change(passwordInput, { target: { value: 'secret' } });

    const form = screen.getByTestId('login-form');
    
    fireEvent.submit(form);
    expect(mockHandleAuthSubmit).toHaveBeenCalled();
  });
});
