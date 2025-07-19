import React from 'react';
import { render } from '@testing-library/react';
import { SettingsProvider } from '../context/SettingsContext';
import { AuthProvider } from '../context/AuthContext';
import UserProfilePage from '../components/pages/UserProfilePage';

// Minimal wrapper to provide context
function renderWithProviders(ui) {
  return render(
    <AuthProvider>
      <SettingsProvider>{ui}</SettingsProvider>
    </AuthProvider>
  );
}

describe('UserProfilePage', () => {
  test('renders form fields', () => {
    const { getByLabelText } = renderWithProviders(<UserProfilePage />);
    expect(getByLabelText(/Display Name/i)).toBeInTheDocument();
    expect(getByLabelText(/Email/i)).toBeInTheDocument();
  });
});
