import NavbarPetaSimoanginangin from "../components/NavbarPeta/simoanginangin.jsx";
import PetaUMKM from "../components/PetaUMKM";

const PetaUmkmSimoanginangin = () => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 overflow-x-hidden">
      <NavbarPetaSimoanginangin className="flex-none shadow-md z-50" />
      <div className="flex-1 w-full relative z-0 flex flex-col min-h-[600px]">
        <PetaUMKM initialDesaName="SIMOANGINANGIN" />
      </div>
    </div>
  );
};

export default PetaUmkmSimoanginangin;
