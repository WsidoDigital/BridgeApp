import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import MSALAuth from '../app/auth/MSALAuth';

jest.mock('expo-auth-session', () => {
  return {
    useAuthRequest: jest.fn(() => [{}, null, jest.fn()]),
    makeRedirectUri: jest.fn(() => 'exp://redirect'),
    startAsync: jest.fn(),
  };
});

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => null),
  setItemAsync: jest.fn(() => null),
}));

describe('MSALAuth', () => {
  it('renders and calls sign-in when button pressed', async () => {
    const promptMock = jest.fn();
    const useAuth = require('expo-auth-session').useAuthRequest;
    useAuth.mockReturnValue([{}, null, promptMock]);

    const onSuccess = jest.fn();
    const { getByText } = render(<MSALAuth onSuccess={onSuccess} />);

    const btn = getByText('Sign in with Azure AD');
    fireEvent.press(btn);

    await waitFor(() => expect(promptMock).toHaveBeenCalled());
  });
});
