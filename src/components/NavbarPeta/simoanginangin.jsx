import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from "@nextui-org/react";
import { Link, useNavigate } from "react-router-dom";

export default function NavbarPetaSimoanginangin({ desaName = "SIMO ANGIN ANGIN" }) {
  const navigate = useNavigate();
  return (
    <div className="sticky top-0 z-50">
      <Navbar maxWidth="full" className="bg-[page] h-[11vh] p-3 sm:p-2 flex shadow-lg w-full">
        <NavbarBrand justify="left">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Coat_of_Arms_of_Sidoarjo_Regency.png/664px-Coat_of_Arms_of_Sidoarjo_Regency.png"
            alt="Sidoarjo Coat of Arms"
            width={48}
            height={48}
          />
          <img
            className="ml-1"
            src="/pict/logo_dc.png"
            alt="Desa Cantik Logo"
            width={48}
            height={48}
          />
          <img
            className="ml-1"
            src="/pict/Ketenagakerjaan_Simoanginangin.png"
            alt="Ketenagakerjaan"
            width={75}
            height={50}
          />
          <div className="ml-3 flex items-center gap-4">
            <p className="font-sfProDisplay font-semibold text-[#0F1820] leading-tight">
              PETA UMKM
              <br />
              <span className="text-[1.2rem] font-bold font-sfProDisplay uppercase">
                {desaName !== "SIDOARJO" ? `DESA ${desaName}` : "DESA SIMO ANGIN ANGIN"}
              </span>
            </p>
          </div>
        </NavbarBrand>
        <NavbarContent className="hidden gap-4 sm:flex" justify="center">
          {/* Add other NavbarItems if needed */}
        </NavbarContent>
        <NavbarContent justify="end">
          <NavbarItem>
            <button 
              onClick={() => navigate('/')}
              className="w-full sm:w-auto px-6 py-2 bg-[#2563eb] text-white rounded-full font-bold transition-all shadow-lg border-[3px] border-[#2563eb] hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5 text-sm md:text-base flex items-center justify-center gap-2 shrink-0 h-10"
            >
              <span className="font-extrabold text-lg -mt-1">&laquo;</span> Peta Tematik
            </button>
          </NavbarItem>
          <NavbarItem>
            <Link
              to="/login-simoanginangin"
              className="flex items-center justify-center p-2 bg-[black] text-white font-medium rounded-xl md:rounded-full md:px-4 md:py-2 md:text-base cursor-pointer"
            >
              <span className="hidden md:inline">Masuk</span>
              <span className="md:hidden material-icons">account_circle</span>
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link
              to="https://drive.google.com/drive/folders/1BRi8Bhm6BzYQksJNKAoWkcAoN96uk2ZZ?usp=drive_link"
              className="flex items-center justify-center p-2 bg-[black] text-white font-medium rounded-xl md:rounded-full md:px-4 md:py-2 md:text-base cursor-pointer mr-2"
              target="_blank" // Opens the link in a new tab
              rel="noopener noreferrer" // Provides security benefits
            >
              <span className="hidden md:inline material-icons">folder</span>
              <span className="md:hidden material-icons">folder</span>
            </Link>
          </NavbarItem>
        </NavbarContent>
      </Navbar>
    </div>
  );
}
