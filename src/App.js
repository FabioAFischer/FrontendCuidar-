import { useState } from "react";
import AdminDashboard from "./pages/Administrador/DashBoard/Admindashboard";
import "./styles/global.css";
import "./App.css";

export default function App() {
  const [tela, setTela] = useState("dashboard-admin");

  function renderTela() {
    switch (tela) {
      case "dashboard-admin":
        return (
          <AdminDashboard
            onLogout={() => setTela("login")}
          />
        );

      // case "login":
      //   return <Login onSucesso={() => setTela("dashboard-admin")} />;

      // case "empresa":
      //   return <EmpresaDashboard onLogout={() => setTela("login")} />;

      default:
        return (
          <div style={{ padding: "2rem", textAlign: "center", color: "#888" }}>
            Tela não encontrada.
          </div>
        );
    }
  }

  return <>{renderTela()}</>;
}