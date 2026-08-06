import { useLocation } from "react-router-dom";
import NavbarPetaSidokepung from "../components/NavbarPeta/sidokepung.jsx";
import MapSection from "../components/PetaPekerjaan";

const PetaPekerjaanSidokepung = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const desaName = searchParams.get("desa") || "SIDOARJO";

  return (
    <div className="w-screen h-screen relative flex flex-col bg-gray-200 overflow-hidden font-sans">
      <MapSection desaName={desaName} />
    </div>
  );
};

export default PetaPekerjaanSidokepung;
