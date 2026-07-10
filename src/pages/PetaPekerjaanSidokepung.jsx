import Footer from "../components/Footer";
import NavbarPetaSidokepung from "../components/NavbarPeta/sidokepung.jsx";
import MapSection from "../components/PetaPekerjaan";

const PetaPekerjaanSidokepung = () => {
  return (
    <div className="w-full h-full relative">
      <NavbarPetaSidokepung />
      <MapSection />
      {/* <Footer /> */}
    </div>
  );
};

export default PetaPekerjaanSidokepung;
