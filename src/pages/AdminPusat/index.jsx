import React, { useState, useEffect, useMemo } from "react";
import AdminLayout from "../../components/AdminLayout";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, CheckboxGroup, Checkbox, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, useDisclosure, Select, SelectItem, Pagination } from "@nextui-org/react";
import { Link, useNavigate } from "react-router-dom";
import api6 from "../../utils/api6";
import api5 from "../../utils/api5"; // Assuming api5 is used for auth based on Login/index.jsx
import { message } from "antd";

const availableThemes = [
  "Sosial Kependudukan",
  "Ekonomi Perdagangan",
  "Pertanian Pertambangan"
];

const AdminPusat = () => {
  const [villagesByKecamatan, setVillagesByKecamatan] = useState({});
  const [kecamatanList, setKecamatanList] = useState([]);
  const [selectedKecamatan, setSelectedKecamatan] = useState("");
  const [selectedThemeFilter, setSelectedThemeFilter] = useState("Semua Tema");
  const [villages, setVillages] = useState([]);

  const [themeSettings, setThemeSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingState, setSavingState] = useState({}); // Track saving per village
  
  // Modal states for Tambah Admin
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [newAdminDesa, setNewAdminDesa] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const navigate = useNavigate();

  // Filter villages dynamically based on both filters
  const filteredVillages = villages.filter(desa => {
    if (selectedThemeFilter === "Semua Tema") return true;
    const desaThemes = themeSettings[desa] || [];
    return desaThemes.includes(selectedThemeFilter);
  });

  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const pages = Math.ceil(filteredVillages.length / rowsPerPage);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredVillages.slice(start, end);
  }, [page, filteredVillages]);

  useEffect(() => {
    setPage(1);
  }, [selectedKecamatan, selectedThemeFilter]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [themesRes, villagesRes] = await Promise.all([
        api6.get("/api/village-themes"),
        api6.get("/api/villages/by-kecamatan")
      ]);

      const themesData = themesRes.data || {};
      setThemeSettings(themesData);

      const villagesData = villagesRes.data || {};
      setVillagesByKecamatan(villagesData);
      
      const kecamatans = Object.keys(villagesData).sort();
      setKecamatanList(kecamatans);
      
      // Default to "Semua Kecamatan"
      setSelectedKecamatan("Semua Kecamatan");
      const allVillages = Object.values(villagesData).flat().sort();
      setVillages(allVillages);
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("Gagal mengambil data pengaturan tema atau desa");
    } finally {
      setLoading(false);
    }
  };

  const handleKecamatanChange = (e) => {
    const kec = e.target.value;
    setSelectedKecamatan(kec);
    
    if (kec === "Semua Kecamatan") {
      const allVillages = Object.values(villagesByKecamatan).flat().sort();
      setVillages(allVillages);
    } else {
      setVillages(villagesByKecamatan[kec] || []);
    }
  };

  const handleThemeChange = (desa, selectedThemes) => {
    setThemeSettings(prev => ({
      ...prev,
      [desa]: selectedThemes
    }));
  };

  const handleSave = async (desa) => {
    setSavingState(prev => ({ ...prev, [desa]: true }));
    try {
      await api6.post("/api/village-themes", {
        desa_name: desa,
        themes: themeSettings[desa] || []
      });
      message.success(`Pengaturan tema ${desa} berhasil disimpan!`);
    } catch (error) {
      console.error("Error saving theme:", error);
      message.error(`Gagal menyimpan pengaturan tema ${desa}`);
    } finally {
      setSavingState(prev => ({ ...prev, [desa]: false }));
    }
  };

  const handleCreateAdmin = async (onClose) => {
    if (!newAdminDesa || !newAdminPassword) {
      message.warning("Mohon lengkapi nama desa dan password!");
      return;
    }
    
    setIsCreating(true);
    const formattedDesa = newAdminDesa.trim().toLowerCase().replace(/\s+/g, "");
    const username = `admin_${formattedDesa}`;
    
    try {
      // Create admin using backend
      await api5.post("/api/auth/create-admin", {
        username: username,
        password: newAdminPassword
      });
      
      message.success(`Admin untuk desa ${newAdminDesa} berhasil dibuat!`);
      
      // Add to table
      const displayDesa = formattedDesa.toUpperCase();
      if (!villages.includes(displayDesa)) {
        setVillages(prev => [...prev, displayDesa]);
      }
      
      // Close modal
      onClose();
      setNewAdminDesa("");
      setNewAdminPassword("");
    } catch (error) {
      console.error("Error creating admin:", error);
      message.error(error.response?.data?.message || "Gagal membuat admin baru.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <AdminLayout pageTitle="Dashboard Admin Pusat">
      <div className="flex flex-col gap-5 pt-5 sm:px-6 mb-16 h-full pb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 w-full">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-1">Manajemen Desa Cantik</h2>
              <p className="text-gray-600 text-sm">Pilih desa dan atur tema potensi yang aktif untuk mengkonfigurasi panel admin mereka.</p>
            </div>
            <div className="flex items-center gap-4">
              <Select
                label="Pilih Tema"
                className="w-48"
                size="sm"
                selectedKeys={[selectedThemeFilter]}
                onChange={(e) => setSelectedThemeFilter(e.target.value)}
              >
                <SelectItem key="Semua Tema" value="Semua Tema">Semua Tema</SelectItem>
                <SelectItem key="Sosial Kependudukan" value="Sosial Kependudukan">Sosial Kependudukan</SelectItem>
                <SelectItem key="Ekonomi Perdagangan" value="Ekonomi Perdagangan">Ekonomi Perdagangan</SelectItem>
                <SelectItem key="Pertanian Pertambangan" value="Pertanian Pertambangan">Pertanian Pertambangan</SelectItem>
              </Select>
              <Select
                label="Pilih Kecamatan"
                className="w-48"
                size="sm"
                selectedKeys={[selectedKecamatan]}
                onChange={handleKecamatanChange}
              >
                <SelectItem key="Semua Kecamatan" value="Semua Kecamatan">Semua Kecamatan</SelectItem>
                {kecamatanList.map(kec => (
                  <SelectItem key={kec} value={kec}>{kec}</SelectItem>
                ))}
              </Select>
            </div>
          </div>

          <Table 
            aria-label="Tabel Pengaturan Desa" 
            className="w-full"
            bottomContent={
              pages > 1 ? (
                <div className="flex w-full justify-center mt-2">
                  <Pagination
                    isCompact
                    showControls
                    showShadow
                    color="primary"
                    page={page}
                    total={pages}
                    onChange={(page) => setPage(page)}
                  />
                </div>
              ) : null
            }
          >
            <TableHeader>
              <TableColumn>NAMA DESA</TableColumn>
              <TableColumn>PENGATURAN TEMA</TableColumn>
              <TableColumn align="center">AKSI</TableColumn>
            </TableHeader>
            <TableBody emptyContent={loading ? "Memuat..." : "Tidak ada data"}>
              {items.map((desa) => (
                <TableRow key={desa}>
                  <TableCell className="font-semibold text-blue-900">{desa}</TableCell>
                  <TableCell>
                    <CheckboxGroup
                      orientation="horizontal"
                      value={themeSettings[desa] || []}
                      onValueChange={(val) => handleThemeChange(desa, val)}
                    >
                      {availableThemes.map(theme => (
                        <Checkbox key={theme} value={theme}>{theme}</Checkbox>
                      ))}
                    </CheckboxGroup>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 justify-center">
                      <Button 
                        color="success" 
                        size="sm" 
                        variant="solid"
                        className="text-white font-medium"
                        isLoading={savingState[desa]}
                        onClick={() => handleSave(desa)}
                      >
                        Simpan
                      </Button>
                      <Button 
                        color="primary" 
                        size="sm"
                        variant="flat"
                        onClick={() => {
                          // Allow smooth navigation directly
                          navigate(`/admin/desa/${desa}`);
                        }}
                      >
                        Akses Panel
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal Tambah Admin */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="top-center">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Tambah Admin Desa Baru</ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-gray-500">
                    Sistem akan otomatis membuat username dengan format <span className="font-mono text-blue-600 bg-blue-50 px-1">admin_namadesa</span>.
                  </p>
                  <Input
                    autoFocus
                    label="Nama Desa"
                    placeholder="Contoh: Buduran"
                    variant="bordered"
                    value={newAdminDesa}
                    onChange={(e) => setNewAdminDesa(e.target.value)}
                  />
                  <Input
                    label="Password"
                    placeholder="Masukkan password admin"
                    type="password"
                    variant="bordered"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="flat" onPress={onClose}>
                  Batal
                </Button>
                <Button color="primary" isLoading={isCreating} onPress={() => handleCreateAdmin(onClose)}>
                  Buat Akun
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

    </AdminLayout>
  );
};

export default AdminPusat;
