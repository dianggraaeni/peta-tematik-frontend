import { Navbar, NavbarBrand, NavbarContent, NavbarItem } from "@nextui-org/react";
import { Link } from "react-router-dom";

export default function NavbarUtama({ title, subtitle }) {
  return (
    <div className="sticky top-0 z-50">
      <Navbar maxWidth="full" className="bg-base h-[11vh] p-3 sm:p-2 mx-0 flex shadow-lg">
        <NavbarBrand justify="left">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Coat_of_Arms_of_Sidoarjo_Regency.png/664px-Coat_of_Arms_of_Sidoarjo_Regency.png"
            alt="Sidoarjo Coat of Arms"
            width={48}
            height={48}
          />
          <div className="ml-3">
            <p className="font-sfProDisplay font-semibold text-[#0F1820] leading-tight">
              {title}
              <br />
              <span className="text-lg font-bold font-sfProDisplay">{subtitle}</span>
            </p>
          </div>
        </NavbarBrand>
        <NavbarContent className="gap-6 flex" justify="center">
          <NavbarItem>
            <img
              src="/pict/logo_bps.jpg"
              alt="BPS Sidoarjo Logo"
              width={48}
              height={48}
              className="object-contain"
            />
          </NavbarItem>
          <NavbarItem>
            <img
              src="/pict/logo_dc.png"
              alt="Desa Cantik Logo"
              width={48}
              height={48}
              className="object-contain"
            />
          </NavbarItem>
        </NavbarContent>
        <NavbarContent justify="end">
          <NavbarItem>
            <Link
              to="https://sidoarjokab.bps.go.id/"
              className="flex items-center justify-center p-2 bg-[#0F1820] text-white font-medium rounded-xl md:rounded-full md:px-4 md:py-2 md:text-base cursor-pointer mr-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="hidden md:inline">BPS Sidoarjo</span>
              <span className="md:hidden material-icons">language</span>
            </Link>
          </NavbarItem>
        </NavbarContent>
      </Navbar>
    </div>
  );
}
