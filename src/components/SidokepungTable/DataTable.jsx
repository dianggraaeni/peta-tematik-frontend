import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Chip,
  Pagination,
  Spinner,
} from "@nextui-org/react";
import { AiOutlineEdit, AiOutlineDelete } from "react-icons/ai";

const DataTable = ({
  data,
  loading,
  currentPage,
  totalPages,
  onPageChange,
  onEdit,
  onDelete,
}) => {
  // Helper function to get work field label
  const getWorkFieldLabel = (value) => {
    if (!value) return "Tidak Diset";

    const workFieldMap = {
      A: "Pertanian, Kehutanan dan Perikanan",
      B: "Pertambangan dan Penggalian",
      C: "Industri Pengolahan",
      D: "Pengadaan Listrik, Gas, Uap dan AC",
      E: "Pengadaan Air, Pengelolaan Sampah dan Daur Ulang",
      F: "Konstruksi",
      G: "Perdagangan Besar dan Eceran",
      H: "Transportasi dan Pergudangan",
      I: "Penyediaan Akomodasi dan Makan Minum",
      J: "Informasi dan Komunikasi",
      K: "Jasa Keuangan dan Asuransi",
      L: "Real Estat",
      M: "Jasa Profesional, Ilmiah dan Teknis",
      N: "Jasa Persewaan dan Penunjang Usaha",
      O: "Administrasi Pemerintahan",
      P: "Jasa Pendidikan",
      Q: "Jasa Kesehatan dan Kegiatan Sosial",
      R: "Kesenian, Hiburan dan Rekreasi",
      S: "Jasa lainnya",
      T: "Jasa Perorangan Rumah Tangga",
      U: "Kegiatan Badan Internasional",
    };

    return workFieldMap[value] || value;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <>
      <Table aria-label="Data Pekerjaan"
        classNames={{ th: "bg-[#1f2937] text-white font-semibold text-sm border-none", wrapper: "shadow-none p-0" }}>
        <TableHeader>
          <TableColumn>NAMA</TableColumn>
          <TableColumn>RT/RW</TableColumn>
          <TableColumn>UMUR</TableColumn>
          <TableColumn>JENIS KELAMIN</TableColumn>
          <TableColumn>STATUS PEKERJAAN</TableColumn>
          <TableColumn>BIDANG PEKERJAAN</TableColumn>{" "}
          <TableColumn>AKSI</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent={
            <div className="text-center py-8">
              <p className="text-gray-500 mb-2">Tidak ada data</p>
              <p className="text-sm text-gray-400">
                Klik "Tambah Data" atau "Upload CSV/JSON" untuk menambah data
              </p>
            </div>
          }
        >
          {data.map((item, index) => (
            <TableRow key={item._id || index}>
              <TableCell className="font-medium">{item.nama_anggota}</TableCell>
              <TableCell>
                {item.rt}/{item.rw}
              </TableCell>
              <TableCell>{item.umur}</TableCell>
              <TableCell>
                <Chip
                  color={
                    item.jenis_kelamin === "Laki-laki" ? "primary" : "secondary"
                  }
                  variant="flat"
                  size="sm"
                >
                  {item.jenis_kelamin}
                </Chip>
              </TableCell>
              <TableCell>
                <Chip
                  color={
                    item.status_pekerjaan_utama === "Bekerja"
                      ? "success"
                      : "default"
                  }
                  variant="flat"
                  size="sm"
                >
                  {item.status_pekerjaan_utama}
                </Chip>
              </TableCell>
              <TableCell>
                <Chip
                  color="warning"
                  variant="flat"
                  size="sm"
                  className="max-w-[200px]"
                >
                  <span className="truncate">
                    {item.bidang_pekerjaan
                      ? `${item.bidang_pekerjaan} - ${getWorkFieldLabel(
                          item.bidang_pekerjaan
                        )}`
                      : "Tidak Diset"}
                  </span>
                </Chip>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    isIconOnly
                    size="sm"
                    
                    color="primary"
                    onClick={() => onEdit(item)}
                  >
                    <AiOutlineEdit />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    
                    color="danger"
                    onClick={() => onDelete(item)}
                  >
                    <AiOutlineDelete />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination
            total={totalPages}
            page={currentPage}
            onChange={onPageChange}
            color="primary"
          />
        </div>
      )}
    </>
  );
};

export default DataTable;
