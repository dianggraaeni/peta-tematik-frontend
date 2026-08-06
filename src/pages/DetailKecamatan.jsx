import NavbarDetailKecamatan from "../components/NavbarPeta/detailKecamatan.jsx";
import DetailKecamatanMap from "../components/DetailKecamatan/index.jsx";
import { useParams } from "react-router-dom";

// Mapping slug -> display name
const kecamatanConfig = {
  balongbendo: "Balongbendo",
  buduran: "Buduran",
};

const DetailKecamatan = () => {
  const { slug } = useParams();
  const kecamatanName = kecamatanConfig[slug?.toLowerCase()] || slug || "Kecamatan";

  return (
    <div className="w-screen h-screen relative flex flex-col overflow-hidden bg-gray-200">
      <DetailKecamatanMap
        kecamatanSlug={slug?.toLowerCase()}
        kecamatanName={kecamatanName}
      />
    </div>
  );
};

export default DetailKecamatan;
