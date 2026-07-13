import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaHome, FaDoorOpen, FaTable } from "react-icons/fa";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const tokenPusat = localStorage.getItem("token-pusat");
  const isSuperAdmin = !!tokenPusat;

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const currentPath = location.pathname;

  return (
    <div className="w-64 min-h-screen bg-[#1f2937] text-white flex flex-col shadow-xl">
      <div className="p-6 bg-[#111827] flex items-center justify-center">
        <h1 className="text-xl font-bold font-inter text-center">
          {isSuperAdmin ? "Super Admin" : "Admin Desa"}
        </h1>
      </div>

      <div className="flex-1 px-4 py-6 space-y-2 font-inter">
        <Link
          to="/"
          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#374151] transition-colors"
        >
          <FaHome className="text-lg" />
          <span className="font-semibold">Beranda Peta</span>
        </Link>

        <div className="pt-4 pb-2">
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Kelola Data
          </p>
        </div>

        {isSuperAdmin ? (
          <>
            <Link
              to="/admin-sidokepung"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                currentPath === "/admin-sidokepung" || currentPath === "/admin-pusat"
                  ? "bg-[#2563eb] shadow-md"
                  : "hover:bg-[#374151]"
              }`}
            >
              <FaTable className="text-lg" />
              <span className="font-semibold text-sm">Data Sidokepung</span>
            </Link>
            <Link
              to="/admin-grogol"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                currentPath === "/admin-grogol"
                  ? "bg-[#2563eb] shadow-md"
                  : "hover:bg-[#374151]"
              }`}
            >
              <FaTable className="text-lg" />
              <span className="font-semibold text-sm">Data Grogol</span>
            </Link>
            <Link
              to="/admin-simoanginangin"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                currentPath === "/admin-simoanginangin"
                  ? "bg-[#2563eb] shadow-md"
                  : "hover:bg-[#374151]"
              }`}
            >
              <FaTable className="text-lg" />
              <span className="font-semibold text-sm">Data Simoanginangin</span>
            </Link>
            <Link
              to="/admin-simoketawang"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                currentPath === "/admin-simoketawang"
                  ? "bg-[#2563eb] shadow-md"
                  : "hover:bg-[#374151]"
              }`}
            >
              <FaTable className="text-lg" />
              <span className="font-semibold text-sm">Data Simoketawang</span>
            </Link>
          </>
        ) : (
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#2563eb] shadow-md">
            <FaTable className="text-lg" />
            <span className="font-semibold">Tabel Data</span>
          </div>
        )}
      </div>

      <div className="p-4 bg-[#111827]">
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
