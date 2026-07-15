import React, { useState, useMemo } from "react";
import AdminLayout from "../AdminLayout";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Button,
  useDisclosure,
  Pagination,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@nextui-org/react";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import { SearchIcon } from "../GrogolSlsTable/SearchIcon";
import { message, Popconfirm } from "antd";

const columns = [
  { name: "NO", uid: "no" },
  { name: "NAMA DESA", uid: "nama_desa" },
  { name: "KATEGORI TEMA", uid: "kategori" },
  { name: "POTENSI / DETAIL", uid: "potensi" },
  { name: "AKSI", uid: "aksi" },
];

const PotensiAdmin = () => {
  const [data, setData] = useState([
    { id: 1, nama_desa: "Simoketawang", kategori: "Pertanian Pertambangan", potensi: "Kelengkeng" },
    { id: 2, nama_desa: "Simoketawang", kategori: "Ekonomi Perdagangan", potensi: "UMKM" },
    { id: 3, nama_desa: "Grogol", kategori: "Pertanian Pertambangan", potensi: "Sayuran" },
    { id: 4, nama_desa: "Sidokepung", kategori: "Sosial Kependudukan", potensi: "Ketenagakerjaan" },
    { id: 5, nama_desa: "Simoanginangin", kategori: "Ekonomi Perdagangan", potensi: "Kawasan Industri" }
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [modalType, setModalType] = useState("add");
  const [selectedItem, setSelectedItem] = useState(null);

  const filteredData = useMemo(() => {
    return data.filter((item) =>
      Object.values(item).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  const pages = Math.ceil(filteredData.length / rowsPerPage) || 1;

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredData.slice(start, end);
  }, [page, filteredData, rowsPerPage]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const openModal = (type, item = null) => {
    setModalType(type);
    setSelectedItem(item);
    onOpen();
  };

  const handleDelete = (id) => {
    setData(data.filter((item) => item.id !== id));
    message.success("Berhasil menghapus potensi desa!");
  };

  const handleFormSubmit = (e, onClose) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newData = {
      nama_desa: formData.get("nama_desa"),
      kategori: formData.get("kategori"),
      potensi: formData.get("potensi"),
    };

    if (modalType === "add") {
      setData([...data, { id: Date.now(), ...newData }]);
      message.success("Berhasil menambahkan potensi desa!");
    } else {
      setData(data.map((item) => (item.id === selectedItem.id ? { ...item, ...newData } : item)));
      message.success("Berhasil mengubah potensi desa!");
    }
    onClose();
  };

  const renderCell = (item, columnKey, index) => {
    switch (columnKey) {
      case "no":
        return (page - 1) * rowsPerPage + index + 1;
      case "nama_desa":
        return <span className="font-semibold">{item.nama_desa}</span>;
      case "kategori":
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            item.kategori === 'Sosial Kependudukan' ? 'bg-blue-100 text-blue-800' :
            item.kategori === 'Ekonomi Perdagangan' ? 'bg-emerald-100 text-emerald-800' :
            'bg-amber-100 text-amber-800'
          }`}>
            {item.kategori}
          </span>
        );
      case "potensi":
        return item.potensi;
      case "aksi":
        return (
          <div className="flex items-center justify-center gap-3">
            <button
              className="text-blue-600 hover:text-blue-800"
              onClick={() => openModal("edit", item)}
            >
              <FaEdit size={18} />
            </button>
            <Popconfirm
              title="Hapus data?"
              description="Apakah Anda yakin ingin menghapus data ini?"
              onConfirm={() => handleDelete(item.id)}
              okText="Ya"
              cancelText="Tidak"
            >
              <button className="text-red-500 hover:text-red-700">
                <FaTrash size={18} />
              </button>
            </Popconfirm>
          </div>
        );
      default:
        return item[columnKey];
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col items-center w-full min-h-screen font-inter text-[#1f2937] p-4 lg:p-8">
        <div className="w-full max-w-7xl">
          <h1 className="font-semibold text-[16px] mb-[12px] bg-white py-2 px-3 w-fit rounded-xl shadow-sm">
            Tabel Potensi Desa (Peta Tematik)
          </h1>
          
          <div className="p-4 bg-[#ffffffb4] rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-4 gap-4">
              <Input
                label="Pencarian"
                radius="lg"
                classNames={{
                  inputWrapper: ["shadow"],
                }}
                placeholder="Ketikkan kata kunci..."
                startContent={
                  <SearchIcon className="mb-0.5 text-blue-800 pointer-events-none flex-shrink-0" />
                }
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full sm:max-w-[50%]"
              />
              <Button
                color="primary"
                className="text-[14px] font-semibold text-white bg-blue-600 hover:bg-blue-700 h-14 px-6 rounded-xl"
                startContent={<FaPlus className="text-[18px] text-white" />}
                onClick={() => openModal("add")}
              >
                Tambah
              </Button>
            </div>
            
            <Table
              aria-label="Tabel Potensi Desa"
              shadow="none"
              className="shadow-md rounded-xl overflow-hidden font-inter"
              classNames={{
                th: ["bg-blue-100", "text-blue-800", "font-inter", "text-[14px]", "font-semibold", "py-3"],
                td: ["py-3"],
              }}
              bottomContent={
                <div className="flex justify-center w-full py-2">
                  <Pagination
                    isCompact
                    showControls
                    showShadow
                    color="primary"
                    page={page}
                    total={pages}
                    onChange={(newPage) => setPage(newPage)}
                    classNames={{
                      cursor: "bg-blue-600 text-white",
                    }}
                  />
                </div>
              }
            >
              <TableHeader columns={columns} className="font-inter text-blue-800">
                {(column) => (
                  <TableColumn
                    key={column.uid}
                    align={column.uid === "aksi" ? "center" : "start"}
                  >
                    {column.name}
                  </TableColumn>
                )}
              </TableHeader>
              <TableBody
                items={items}
                emptyContent={"Tidak ada data."}
              >
                {(item) => (
                  <TableRow key={item.id}>
                    {(columnKey) => (
                      <TableCell>{renderCell(item, columnKey, items.indexOf(item))}</TableCell>
                    )}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="top-center" classNames={{
        base: "font-inter"
      }}>
        <ModalContent>
          {(onClose) => (
            <form onSubmit={(e) => handleFormSubmit(e, onClose)}>
              <ModalHeader className="flex flex-col gap-1 bg-blue-600 text-white rounded-t-xl py-4">
                {modalType === "add" ? "Tambah Data Potensi" : "Ubah Data Potensi"}
              </ModalHeader>
              <ModalBody className="py-6">
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-sm font-semibold mb-1 text-gray-700 block">Nama Desa</label>
                    <Input
                      autoFocus
                      name="nama_desa"
                      placeholder="Masukkan nama desa"
                      variant="bordered"
                      defaultValue={selectedItem?.nama_desa}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 text-gray-700 block">Kategori Tema</label>
                    <select
                      name="kategori"
                      className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-blue-500 outline-none transition-colors"
                      defaultValue={selectedItem?.kategori || "Sosial Kependudukan"}
                      required
                    >
                      <option value="Sosial Kependudukan">Sosial Kependudukan</option>
                      <option value="Ekonomi Perdagangan">Ekonomi Perdagangan</option>
                      <option value="Pertanian Pertambangan">Pertanian Pertambangan</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 text-gray-700 block">Potensi / Deskripsi</label>
                    <Input
                      name="potensi"
                      placeholder="Contoh: UMKM, Kelengkeng, dll."
                      variant="bordered"
                      defaultValue={selectedItem?.potensi}
                      required
                    />
                  </div>
                </div>
              </ModalBody>
              <ModalFooter className="border-t border-gray-100">
                <Button color="danger" variant="flat" onPress={onClose} className="font-semibold">
                  Batal
                </Button>
                <Button color="primary" type="submit" className="bg-blue-600 font-semibold shadow-md">
                  Simpan
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>
    </AdminLayout>
  );
};

export default PotensiAdmin;
