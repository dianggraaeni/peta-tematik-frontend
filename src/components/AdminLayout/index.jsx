import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaHome, FaDoorOpen, FaTable } from "react-icons/fa";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "";
  const isSuperAdmin = username === "admin_pusat" || localStorage.getItem("token-pusat");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const currentPath = location.pathname;

  let adminRoute = "/admin/pusat";
  if (!isSuperAdmin && username.startsWith("admin_")) {
    const desaName = username.replace("admin_", "").toUpperCase();
    adminRoute = `/admin/desa/${desaName}`;
  }

  return (
    <div className="w-64 bg-blue-900 text-white min-h-screen flex flex-col shadow-xl">
      <div className="p-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-blue-400">Desa</span>Cantik
        </h2>
        <p className="text-xs text-blue-200 mt-2">BPS Kabupaten Sidoarjo</p>
      </div>

      <div className="flex-1 px-4 space-y-2 mt-4">
        {isSuperAdmin ? (
          <>
            <div className="mb-4">
              <p className="px-4 text-xs font-semibold text-blue-200 uppercase tracking-wider">
                Menu Pusat
              </p>
            </div>
            <Link
              to="/admin/pusat"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                currentPath.startsWith("/admin/pusat")
                  ? "bg-blue-500 shadow-md"
                  : "hover:bg-blue-800"
              }`}
            >
              <FaHome className="text-lg" />
              <span className="font-semibold">Dashboard Utama</span>
            </Link>
          </>
        ) : (
          <>
            <div className="mb-4 mt-2">
              <p className="px-4 text-xs font-semibold text-blue-200 uppercase tracking-wider">
                Kelola Data
              </p>
            </div>
            <Link
              to={adminRoute}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                currentPath !== "/admin/potensi"
                  ? "bg-blue-500 shadow-md"
                  : "hover:bg-blue-800"
              }`}
            >
              <FaTable className="text-lg" />
              <span className="font-semibold">Data Desa Saya</span>
            </Link>
          </>
        )}
      </div>

      <div className="p-4 bg-blue-950">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 rounded-lg font-semibold transition-colors shadow-md"
        >
          <FaDoorOpen className="text-lg" />
          Keluar
        </button>
      </div>
    </div>
  );
};

const AdminLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        <div className="p-6 md:p-10">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
