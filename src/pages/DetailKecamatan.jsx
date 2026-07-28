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
    <div className="w-full min-h-screen relative flex flex-col bg-slate-50 overflow-x-hidden">
      <NavbarDetailKecamatan kecamatanName={kecamatanName.toUpperCase()} />
      <div className="flex-1 w-full relative z-0 flex flex-col" style={{ minHeight: "calc(100vh - 64px)" }}>
        <DetailKecamatanMap
          kecamatanSlug={slug?.toLowerCase()}
          kecamatanName={kecamatanName}
        />
      </div>
    </div>
  );
};

export default DetailKecamatan;
