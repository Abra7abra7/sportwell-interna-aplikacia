import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LoginPage from './page';

// Mock `next/navigation`
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn() })
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
    expect(screen.getByText('Vitajte späť')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('vas@email.sk')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('••••••••')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Získať prihlasovací kód/i })).toBeInTheDocument();
  });

  it('allows user to input email', () => {
    render(<LoginPage />);
    const emailInput = screen.getByPlaceholderText('vas@email.sk');

    fireEvent.change(emailInput, { target: { value: 'test@sportwell.sk' } });
    expect(mockSetAuthEmail).toHaveBeenCalledWith('test@sportwell.sk');
  });

  it('submits the form', () => {
    render(<LoginPage />);
    
    const emailInput = screen.getByPlaceholderText('vas@email.sk');
    fireEvent.change(emailInput, { target: { value: 'test@sportwell.sk' } });

    const form = screen.getByTestId('login-form');
    fireEvent.submit(form);
    expect(mockHandleAuthSubmit).toHaveBeenCalled();
  });
});
