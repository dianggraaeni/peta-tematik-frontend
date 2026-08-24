import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaHome, FaDoorOpen, FaTable, FaBars, FaTimes, FaDatabase } from "react-icons/fa";

const Sidebar = ({ isOpen, setIsOpen, villageThemes = [] }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "";
  const isSuperAdmin = username === "admin_pusat";

  const searchParams = new URLSearchParams(location.search);
  const currentTheme = searchParams.get('theme');

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const currentPath = location.pathname;
  const isViewingVillage = currentPath.toLowerCase().startsWith("/admin/desa/");

  let adminRoute = "/admin/pusat";
  let targetVillage = "";
  if (isViewingVillage) {
    const parts = currentPath.split("/");
    targetVillage = parts[3]; // /admin/desa/ANGGASWANGI
    adminRoute = `/admin/desa/${targetVillage}`;
  } else if (!isSuperAdmin && username.startsWith("admin_")) {
    targetVillage = username.replace("admin_", "").toUpperCase();
    adminRoute = `/admin/desa/${targetVillage}`;
  }

  const showPusatMenu = isSuperAdmin && !isViewingVillage;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <div className={`w-64 bg-blue-900 text-white min-h-screen flex flex-col shadow-xl fixed md:sticky top-0 z-50 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 relative">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-blue-400">Desa</span>Cantik
          </h2>
          <p className="text-xs text-blue-200 mt-2">BPS Kabupaten Sidoarjo</p>
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-6 right-4 text-white md:hidden hover:text-gray-300"
          >
            <FaTimes size={20} />
          </button>
        </div>

      <div className="flex-1 px-4 space-y-2 mt-4">
        {showPusatMenu ? (
          <>
            <div className="mb-4">
              <p className="px-4 text-xs font-semibold text-blue-200 uppercase tracking-wider">
                Menu Pusat
              </p>
            </div>
            <Link
              to="/admin/pusat"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                currentPath === "/admin/pusat"
                  ? "bg-blue-500 shadow-md"
                  : "hover:bg-blue-800"
              }`}
            >
              <FaHome className="text-lg" />
              <span className="font-semibold">Dashboard Utama</span>
            </Link>
            <Link
              to="/admin/pusat/data-peta"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                currentPath.startsWith("/admin/pusat/data-peta")
                  ? "bg-blue-500 shadow-md"
                  : "hover:bg-blue-800"
              }`}
            >
              <FaDatabase className="text-lg" />
              <span className="font-semibold">Update Data Peta</span>
            </Link>
          </>
        ) : (
          <>
            <div className="mb-4 mt-2">
              <p className="px-4 text-xs font-semibold text-blue-200 uppercase tracking-wider">
                Menu Desa
              </p>
            </div>
            <Link
              to={adminRoute}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                currentPath.toLowerCase() === adminRoute.toLowerCase()
                  ? "bg-blue-500 shadow-md"
                  : "hover:bg-blue-800"
              }`}
            >
              <FaHome className="text-lg" />
              <span className="font-semibold">Dashboard Utama</span>
            </Link>

            {villageThemes && villageThemes.length > 0 ? (
              villageThemes.map(theme => {
                const isActive = currentPath.toLowerCase().includes("/update-peta") && currentTheme === theme;
                return (
                  <Link
                    key={theme}
                    to={`${adminRoute}/update-peta?theme=${encodeURIComponent(theme)}`}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-blue-500 shadow-md"
                        : "hover:bg-blue-800"
                    }`}
                  >
                    <FaDatabase className="text-lg" />
                    <span className="font-semibold text-sm leading-tight">Data {theme}</span>
                  </Link>
                );
              })
            ) : (
              <Link
                to={`${adminRoute}/update-peta`}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  currentPath.toLowerCase().includes("/update-peta")
                    ? "bg-blue-500 shadow-md"
                    : "hover:bg-blue-800"
                }`}
              >
                <FaDatabase className="text-lg" />
                <span className="font-semibold">Update Data Peta</span>
              </Link>
            )}
          </>
        )}
      </div>

      <div className="p-4 bg-blue-950 space-y-3">
        {isSuperAdmin && isViewingVillage && (
          <Link
            to="/admin/pusat"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-700 hover:bg-blue-600 rounded-lg font-semibold transition-colors shadow-md text-sm"
          >
            <FaDoorOpen className="text-lg" />
            Kembali Pusat
          </Link>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 rounded-lg font-semibold transition-colors shadow-md"
        >
          <FaDoorOpen className="text-lg" />
          Keluar
        </button>
      </div>
    </div>
    </>
  );
};

const AdminLayout = ({ children, villageThemes = [] }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 relative">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} villageThemes={villageThemes} />
      <main className="flex-1 overflow-x-hidden overflow-y-auto w-full">
        {/* Mobile Header */}
        <div className="md:hidden bg-white shadow-sm px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="text-blue-600">Desa</span>Cantik
          </h2>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="text-gray-600 hover:text-blue-600 focus:outline-none p-1"
          >
            <FaBars size={24} />
          </button>
        </div>
        <div className="p-4 md:p-10 overflow-x-auto">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
