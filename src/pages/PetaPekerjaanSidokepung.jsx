import { useLocation } from "react-router-dom";
import NavbarPetaSidokepung from "../components/NavbarPeta/sidokepung.jsx";
import MapSection from "../components/PetaPekerjaan";

const PetaPekerjaanSidokepung = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const desaName = searchParams.get("desa") || "SIDOARJO";

  return (
    <div className="w-full h-screen relative flex flex-col overflow-hidden">
      <NavbarPetaSidokepung desaName={desaName} />
      <div className="flex-1 w-full relative">
        <MapSection desaName={desaName} />
      </div>
    </div>
  );
};

export default PetaPekerjaanSidokepung;
