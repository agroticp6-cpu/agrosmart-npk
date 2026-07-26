import { createContext, useContext, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("agrosmart_user");
    return stored ? JSON.parse(stored) : null;
  });

  async function login(username, password) {
    const { data } = await api.post("/auth/login", { username, password });
    localStorage.setItem("agrosmart_token", data.token);
    localStorage.setItem("agrosmart_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  async function register(username, password, email) {
    const { data } = await api.post("/auth/register", { username, password, email });
    localStorage.setItem("agrosmart_token", data.token);
    localStorage.setItem("agrosmart_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem("agrosmart_token");
    localStorage.removeItem("agrosmart_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
