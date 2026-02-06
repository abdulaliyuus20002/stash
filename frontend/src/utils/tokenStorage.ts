// Token storage - shared across modules without circular dependencies
let authToken: string | null = null;

export const setToken = (token: string | null) => {
  authToken = token;
};

export const getToken = () => authToken;
