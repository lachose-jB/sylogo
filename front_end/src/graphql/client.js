import { ApolloClient, InMemoryCache, createHttpLink, split } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

// En production, VITE_GRAPHQL_URL et VITE_WS_URL sont définis (Vercel env vars).
// En développement local, le proxy Vite redirige /graphql → localhost:4000.
const GRAPHQL_HTTP = import.meta.env.VITE_GRAPHQL_URL || '/graphql';
const GRAPHQL_WS = import.meta.env.VITE_WS_URL ||
  `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/graphql`;

const httpLink = createHttpLink({ uri: GRAPHQL_HTTP });

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('syligogo_token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: GRAPHQL_WS,
    connectionParams: () => ({
      authorization: localStorage.getItem('syligogo_token')
        ? `Bearer ${localStorage.getItem('syligogo_token')}`
        : '',
    }),
  })
);

const splitLink = split(
  ({ query }) => {
    const def = getMainDefinition(query);
    return def.kind === 'OperationDefinition' && def.operation === 'subscription';
  },
  wsLink,
  authLink.concat(httpLink)
);

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});
