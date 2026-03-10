import { createContext, useContext, useState, useEffect } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { LOGIN, LOGOUT } from '../graphql/mutations/index.js';
import { ME_QUERY } from '../graphql/queries/index.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [localUser, setLocalUser] = useState(null);
  const hasToken = !!localStorage.getItem('syligogo_token');

  const { data, loading: queryLoading, error } = useQuery(ME_QUERY, {
    skip: !hasToken,
  });

  useEffect(() => {
    if (!error) return;
    const isAuthError = error.graphQLErrors?.some(
      (e) => e.extensions?.code === 'UNAUTHENTICATED'
    );
    if (isAuthError) {
      localStorage.removeItem('syligogo_token');
      setLocalUser(null);
    }
  }, [error]);

  // Dériver user depuis la query (refresh) OU depuis localUser (après login)
  const user = data?.me ?? localUser;
  // loading = true tant que la query tourne OU que le token existe mais user pas encore résolu
  const loading = queryLoading || (hasToken && !data?.me && !error && !localUser);

  const [loginMutation] = useMutation(LOGIN);
  const [logoutMutation] = useMutation(LOGOUT);

  const login = async (phone, password) => {
    const { data } = await loginMutation({ variables: { input: { phone, password } } });
    localStorage.setItem('syligogo_token', data.login.token);
    setLocalUser(data.login.user);
    return data.login.user;
  };

  const logout = async () => {
    await logoutMutation();
    localStorage.removeItem('syligogo_token');
    setLocalUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
