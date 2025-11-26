import { useState, useEffect } from "react";
import { Login } from "./components/Login";
import { Main } from "./components/Main";

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for token
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get({ token: null, user: null }, (result) => {
        if (result.token) {
          setToken(result.token as string);
          setUser(result.user);
        }
        setLoading(false);
      });
    } else {
      // Dev mode fallback
      const localToken = localStorage.getItem("token");
      const localUser = localStorage.getItem("user");
      if (localToken) {
        setToken(localToken);
        setUser(localUser ? JSON.parse(localUser) : null);
      }
      setLoading(false);
    }
  }, []);

  const handleLogin = (newToken: string, newUser: any) => {
    setToken(newToken);
    setUser(newUser);
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({ token: newToken, user: newUser });
    } else {
      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(newUser));
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.remove(["token", "user"]);
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-background text-foreground">Loading...</div>;
  }

  return (
    <div className="w-[350px] min-h-[400px] bg-background text-foreground">
      {token ? (
        <Main token={token} user={user} onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
