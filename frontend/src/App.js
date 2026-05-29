import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Analytics from "./pages/Analytics";
import Habits from "./pages/Habits";

function App() {
  const { token } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/home"
          element={token ? <Home /> : <Navigate to="/login" />}
        />
        <Route
          path="/"
          element={token ? <Navigate to="/home" /> : <Navigate to="/login" />}
        />
        <Route
          path="/analytics"
          element={token ? <Analytics /> : <Navigate to="/login" />}
        />
        <Route
          path="/habits"
          element={token ? <Habits /> : <Navigate to="/login" />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
