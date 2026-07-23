import { useLocation } from "react-router-dom";
import NavbarPetaSidokepung from "../components/NavbarPeta/sidokepung.jsx";
import MapSection from "../components/PetaPekerjaan";

const PetaPekerjaanSidokepung = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const desaName = searchParams.get("desa") || "SIDOARJO";

  return (
    <div className="w-full min-h-screen relative flex flex-col bg-slate-50 overflow-x-hidden">
      <NavbarPetaSidokepung desaName={desaName} />
      <div className="flex-1 w-full relative z-0 flex flex-col min-h-[600px]">
        <MapSection desaName={desaName} />
      </div>
    </div>
  );
};

export default PetaPekerjaanSidokepung;
