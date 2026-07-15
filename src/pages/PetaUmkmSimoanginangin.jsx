import NavbarPetaSimoanginangin from "../components/NavbarPeta/simoanginangin.jsx";
import PetaUMKM from "../components/PetaUMKM";

const PetaUmkmSimoanginangin = () => {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <NavbarPetaSimoanginangin className="flex-none shadow-md z-50" />
      <div className="flex-1 min-h-0 relative z-0">
        <PetaUMKM initialDesaName="SIMOANGINANGIN" />
      </div>
    </div>
  );
};

export default PetaUmkmSimoanginangin;
