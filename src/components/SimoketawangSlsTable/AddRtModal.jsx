/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@nextui-org/react";
import { Input } from "@nextui-org/react"; // Assuming Input is imported from @nextui-org/react
import api from "../../utils/api";
import { message } from "antd";
import { Bars } from "react-loader-spinner";
import api3 from "../../utils/api3";

const AddRtModal = ({
  isAddModalOpen,
  onAddModalOpenChange,
  fetchData,
  fetchDataAggregate,
}) => {
  const [addRtData, setAddRtData] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Reset data when modal opens
  useEffect(() => {
    if (isAddModalOpen) {
      setAddRtData({});
      setErrors({});
    }
  }, [isAddModalOpen]);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    let updatedValue = value.replace(",", ".");

    // Default validation message
    let validationMessage = "";

    // Validation logic for each attribute
    switch (name) {
      case "jml_penduduk":
      case "jml_unit_usaha_klengkeng":
      case "jml_unit_usaha_klengkeng_pupuk_organik":
      case "jml_unit_usaha_klengkeng_pupuk_anorganik":
      case "jml_unit_usaha_klengkeng_tidak_ada_pupuk":
      case "jml_unit_usaha_klengkeng_kopi_biji_klengkeng":
      case "jml_unit_usaha_klengkeng_kerajinan_tangan":
      case "jml_unit_usaha_klengkeng_batik_ecoprint":
      case "jml_unit_usaha_klengkeng_minuman":
      case "jml_unit_usaha_klengkeng_makanan":
      case "jml_unit_usaha_klengkeng_tidak_dimanfaatkan":
      case "jml_pohon":
      case "jml_pohon_new_crystal":
      case "jml_pohon_pingpong":
      case "jml_pohon_metalada":
      case "jml_pohon_diamond_river":
      case "jml_pohon_merah":
      case "jml_pohon_blm_berproduksi":
      case "jml_pohon_sdh_berproduksi":
        if (!value) {
          validationMessage = `Jumlah ${name.replace(/_/g, " ")} harus diisi.`;
        } else if (isNaN(value)) {
          validationMessage = `Jumlah ${name.replace(
            /_/g,
            " "
          )} harus berupa angka.`;
        } else if (Number(value) < 0) {
          validationMessage = `Jumlah ${name.replace(
            /_/g,
            " "
          )} harus berupa angka positif.`;
        } else if (!Number.isInteger(Number(value))) {
          validationMessage = `Jumlah ${name.replace(
            /_/g,
            " "
          )} harus berupa angka bulat.`;
        } else {
          validationMessage = "";
        }
        break;
      case "volume_produksi":
        if (!value) {
          validationMessage = `Volume produksi harus diisi.`;
        } else if (isNaN(value)) {
          validationMessage = `Volume produksi harus berupa angka.`;
        } else if (Number(value) < 0) {
          validationMessage = `Volume produksi harus berupa angka positif.`;
        } else {
          validationMessage = "";
        }
        break;
      default:
        // Handle unknown or non-valid fields if needed
        validationMessage = "";
        break;
    }

    // Update the errors object dynamically
    errors[name] = validationMessage;

    // Update the state with the new value
    setAddRtData((prevData) => ({ ...prevData, [name]: updatedValue }));
  };

  const validateForm = (addRtData) => {
    const newErrors = {};

    // Validasi total jumlah pohon
    const totalPohonJenis =
      (parseInt(addRtData.jml_pohon_new_crystal) || 0) +
      (parseInt(addRtData.jml_pohon_pingpong) || 0) +
      (parseInt(addRtData.jml_pohon_metalada) || 0) +
      (parseInt(addRtData.jml_pohon_diamond_river) || 0) +
      (parseInt(addRtData.jml_pohon_merah) || 0);

    if (
      addRtData.jml_pohon &&
      totalPohonJenis !== parseInt(addRtData.jml_pohon)
    ) {
      newErrors.jml_pohon =
        "Jumlah total pohon jenis harus sama dengan jumlah pohon keseluruhan.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddSave = () => {
    if (!validateForm(addRtData)) {
      message.error(
        "Mohon lengkapi semua field yang diperlukan dan perbaiki kesalahan.",
        5
      );
      return;
    }
    if (addRtData) {
      // Convert attributes to integers
      const convertedData = {
        ...addRtData,
        jml_penduduk: parseInt(addRtData.jml_penduduk, 10) || 0,
        jml_unit_usaha_klengkeng:
          parseInt(addRtData.jml_unit_usaha_klengkeng, 10) || 0,
        jml_unit_usaha_klengkeng_pupuk_organik:
          parseInt(addRtData.jml_unit_usaha_klengkeng_pupuk_organik, 10) || 0,
        jml_unit_usaha_klengkeng_pupuk_anorganik:
          parseInt(addRtData.jml_unit_usaha_klengkeng_pupuk_anorganik, 10) ||
          0,
        jml_unit_usaha_klengkeng_tidak_ada_pupuk:
          parseInt(addRtData.jml_unit_usaha_klengkeng_tidak_ada_pupuk, 10) ||
          0,
        jml_unit_usaha_klengkeng_kopi_biji_klengkeng:
          parseInt(
            addRtData.jml_unit_usaha_klengkeng_kopi_biji_klengkeng,
            10
          ) || 0,
        jml_unit_usaha_klengkeng_kerajinan_tangan:
          parseInt(addRtData.jml_unit_usaha_klengkeng_kerajinan_tangan, 10) ||
          0,
        jml_unit_usaha_klengkeng_batik_ecoprint:
          parseInt(addRtData.jml_unit_usaha_klengkeng_batik_ecoprint, 10) || 0,
        jml_unit_usaha_klengkeng_minuman:
          parseInt(addRtData.jml_unit_usaha_klengkeng_minuman, 10) || 0,
        jml_unit_usaha_klengkeng_makanan:
          parseInt(addRtData.jml_unit_usaha_klengkeng_makanan, 10) || 0,
        jml_unit_usaha_klengkeng_tidak_dimanfaatkan:
          parseInt(
            addRtData.jml_unit_usaha_klengkeng_tidak_dimanfaatkan,
            10
          ) || 0,
        jml_pohon: parseInt(addRtData.jml_pohon, 10) || 0,
        jml_pohon_new_crystal:
          parseInt(addRtData.jml_pohon_new_crystal, 10) || 0,
        jml_pohon_pingpong: parseInt(addRtData.jml_pohon_pingpong, 10) || 0,
        jml_pohon_metalada: parseInt(addRtData.jml_pohon_metalada, 10) || 0,
        jml_pohon_diamond_river:
          parseInt(addRtData.jml_pohon_diamond_river, 10) || 0,
        jml_pohon_merah: parseInt(addRtData.jml_pohon_merah, 10) || 0,
        jml_pohon_blm_berproduksi:
          parseInt(addRtData.jml_pohon_blm_berproduksi, 10) || 0,
        jml_pohon_sdh_berproduksi:
          parseInt(addRtData.jml_pohon_sdh_berproduksi, 10) || 0,
        volume_produksi: parseFloat(addRtData.volume_produksi) || 0,
      };
      console.log("Add data:", convertedData);
      addData(convertedData);
    }
  };

  const addData = async (data) => {
    setLoading(true);
    try {
      const response = await api3.post(`/api/sls`, data);
      console.log("Data added:", response.data.data);
      message.success(`SLS ${data.label || 'baru'} berhasil ditambahkan.`, 5);
      onAddModalOpenChange(false); // Close the modal
      await fetchData(); // Fetch updated data
      await fetchDataAggregate();
      setErrors({});
    } catch (error) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        message.error(`Terjadi kesalahan: ${error.response.data.message}`, 5);
      } else {
        message.error(`Terjadi kesalahan: ${error.message}`, 5);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCloseButton = () => {
    setErrors({});
    onAddModalOpenChange(false);
  };

  return (
    <>
      <Modal
        isOpen={isAddModalOpen}
        onOpenChange={onAddModalOpenChange}
        size="xl"
        className="bg-slate-100 font-inter max-h-[90%]"
        classNames={{
          header: "border-b-[1px] border-slate-300",
          footer: "border-t-[1px] border-slate-300",
          body: "overflow-y-auto",
          wrapper: "overflow-y-hidden",
        }}
        hideCloseButton={true}
        isDismissable={false}
      >
        <ModalContent className="font-inter text-blue-800">
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-white bg-blue-600">
                Tambah Satuan Lingkungan Setempat (SLS)
              </ModalHeader>
              <ModalBody className="py-4">
                <div className="space-y-4 simoketawang-sls-edit">
                  <Input
                    label="Kode"
                    placeholder="Masukkan kode (Wajib)"
                    fullWidth
                    name="kode"
                    value={addRtData?.kode ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  <Input
                    label="RT"
                    placeholder="Masukkan RT"
                    fullWidth
                    name="rt"
                    value={addRtData?.rt ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  <Input
                    label="RW"
                    placeholder="Masukkan RW"
                    fullWidth
                    name="rw"
                    value={addRtData?.rw ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  <Input
                    label="Dusun"
                    placeholder="Masukkan Dusun"
                    fullWidth
                    name="dusun"
                    value={addRtData?.dusun ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  <Input
                    label="Unit Usaha Kelengkeng"
                    placeholder="Masukkan jumlah unit usaha kelengkeng"
                    fullWidth
                    name="jml_unit_usaha_klengkeng"
                    value={addRtData?.jml_unit_usaha_klengkeng ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  {errors.jml_unit_usaha_klengkeng && (
                    <p className="ml-3 text-sm text-red-600 font-inter">
                      {errors.jml_unit_usaha_klengkeng}
                    </p>
                  )}
                  <Input
                    label="Unit Usaha Kelengkeng Pupuk Organik"
                    placeholder="Masukkan jumlah unit usaha kelengkeng pupuk organik"
                    fullWidth
                    name="jml_unit_usaha_klengkeng_pupuk_organik"
                    value={
                      addRtData?.jml_unit_usaha_klengkeng_pupuk_organik ?? ""
                    }
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  {errors.jml_unit_usaha_klengkeng_pupuk_organik && (
                    <p className="ml-3 text-sm text-red-600 font-inter">
                      {errors.jml_unit_usaha_klengkeng_pupuk_organik}
                    </p>
                  )}
                  <Input
                    label="Unit Usaha Kelengkeng Pupuk Anorganik"
                    placeholder="Masukkan jumlah unit usaha kelengkeng pupuk anorganik"
                    fullWidth
                    name="jml_unit_usaha_klengkeng_pupuk_anorganik"
                    value={
                      addRtData?.jml_unit_usaha_klengkeng_pupuk_anorganik ?? ""
                    }
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  {errors.jml_unit_usaha_klengkeng_pupuk_anorganik && (
                    <p className="ml-3 text-sm text-red-600 font-inter">
                      {errors.jml_unit_usaha_klengkeng_pupuk_anorganik}
                    </p>
                  )}
                  <Input
                    label="Unit Usaha Kelengkeng Tidak Ada Pupuk"
                    placeholder="Masukkan jumlah unit usaha kelengkeng Tidak Ada Pupuk"
                    fullWidth
                    name="jml_unit_usaha_klengkeng_tidak_ada_pupuk"
                    value={
                      addRtData?.jml_unit_usaha_klengkeng_tidak_ada_pupuk ?? ""
                    }
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  {errors.jml_unit_usaha_klengkeng_tidak_ada_pupuk && (
                    <p className="ml-3 text-sm text-red-600 font-inter">
                      {errors.jml_unit_usaha_klengkeng_tidak_ada_pupuk}
                    </p>
                  )}
                  <Input
                    label="Unit Usaha Kelengkeng Kopi Biji Kelengkeng"
                    placeholder="Masukkan jumlah unit usaha kelengkeng kopi biji kelengkeng"
                    fullWidth
                    name="jml_unit_usaha_klengkeng_kopi_biji_klengkeng"
                    value={
                      addRtData?.jml_unit_usaha_klengkeng_kopi_biji_klengkeng ??
                      ""
                    }
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  {errors.jml_unit_usaha_klengkeng_kopi_biji_klengkeng && (
                    <p className="ml-3 text-sm text-red-600 font-inter">
                      {errors.jml_unit_usaha_klengkeng_kopi_biji_klengkeng}
                    </p>
                  )}
                  <Input
                    label="Unit Usaha Kelengkeng Kerajinan Tangan"
                    placeholder="Masukkan jumlah unit usaha kelengkeng kerajinan tangan"
                    fullWidth
                    name="jml_unit_usaha_klengkeng_kerajinan_tangan"
                    value={
                      addRtData?.jml_unit_usaha_klengkeng_kerajinan_tangan ??
                      ""
                    }
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  {errors.jml_unit_usaha_klengkeng_kerajinan_tangan && (
                    <p className="ml-3 text-sm text-red-600 font-inter">
                      {errors.jml_unit_usaha_klengkeng_kerajinan_tangan}
                    </p>
                  )}
                  <Input
                    label="Unit Usaha Kelengkeng Batik Ecoprint"
                    placeholder="Masukkan jumlah unit usaha kelengkeng batik ecoprint"
                    fullWidth
                    name="jml_unit_usaha_klengkeng_batik_ecoprint"
                    value={
                      addRtData?.jml_unit_usaha_klengkeng_batik_ecoprint ?? ""
                    }
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  {errors.jml_unit_usaha_klengkeng_batik_ecoprint && (
                    <p className="ml-3 text-sm text-red-600 font-inter">
                      {errors.jml_unit_usaha_klengkeng_batik_ecoprint}
                    </p>
                  )}
                  <Input
                    label="Unit Usaha Kelengkeng Minuman"
                    placeholder="Masukkan jumlah unit usaha kelengkeng minuman"
                    fullWidth
                    name="jml_unit_usaha_klengkeng_minuman"
                    value={addRtData?.jml_unit_usaha_klengkeng_minuman ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  {errors.jml_unit_usaha_klengkeng_minuman && (
                    <p className="ml-3 text-sm text-red-600 font-inter">
                      {errors.jml_unit_usaha_klengkeng_minuman}
                    </p>
                  )}
                  <Input
                    label="Unit Usaha Kelengkeng Makanan"
                    placeholder="Masukkan jumlah unit usaha kelengkeng makanan"
                    fullWidth
                    name="jml_unit_usaha_klengkeng_makanan"
                    value={addRtData?.jml_unit_usaha_klengkeng_makanan ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  {errors.jml_unit_usaha_klengkeng_makanan && (
                    <p className="ml-3 text-sm text-red-600 font-inter">
                      {errors.jml_unit_usaha_klengkeng_makanan}
                    </p>
                  )}
                  <Input
                    label="Unit Usaha Kelengkeng Tidak Ada Pemanfaatan"
                    placeholder="Masukkan jumlah unit usaha kelengkeng tidak ada pemanfaatan"
                    fullWidth
                    name="jml_unit_usaha_klengkeng_tidak_dimanfaatkan"
                    value={
                      addRtData?.jml_unit_usaha_klengkeng_tidak_dimanfaatkan ??
                      ""
                    }
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  {errors.jml_unit_usaha_klengkeng_tidak_dimanfaatkan && (
                    <p className="ml-3 text-sm text-red-600 font-inter">
                      {errors.jml_unit_usaha_klengkeng_tidak_dimanfaatkan}
                    </p>
                  )}
                  <Input
                    label="Pohon Kelengkeng"
                    placeholder="Masukkan jumlah pohon kelengkeng"
                    fullWidth
                    name="jml_pohon"
                    value={addRtData?.jml_pohon ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  {errors.jml_pohon && (
                    <p className="ml-3 text-sm text-red-600 font-inter">
                      {errors.jml_pohon}
                    </p>
                  )}
                  <Input
                    label="Pohon Kelengkeng New Crystal"
                    placeholder="Masukkan jumlah pohon kelengkeng new crystal"
                    fullWidth
                    name="jml_pohon_new_crystal"
                    value={addRtData?.jml_pohon_new_crystal ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  {errors.jml_pohon_new_crystal && (
                    <p className="ml-3 text-sm text-red-600 font-inter">
                      {errors.jml_pohon_new_crystal}
                    </p>
                  )}
                  <Input
                    label="Pohon Kelengkeng Pingpong"
                    placeholder="Masukkan jumlah pohon kelengkeng pingpong"
                    fullWidth
                    name="jml_pohon_pingpong"
                    value={addRtData?.jml_pohon_pingpong ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  {errors.jml_pohon_pingpong && (
                    <p className="ml-3 text-sm text-red-600 font-inter">
                      {errors.jml_pohon_pingpong}
                    </p>
                  )}
                  <Input
                    label="Pohon Kelengkeng Metalada"
                    placeholder="Masukkan jumlah pohon kelengkeng metalada"
                    fullWidth
                    name="jml_pohon_metalada"
                    value={addRtData?.jml_pohon_metalada ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  {errors.jml_pohon_metalada && (
                    <p className="ml-3 text-sm text-red-600 font-inter">
                      {errors.jml_pohon_metalada}
                    </p>
                  )}
                  <Input
                    label="Pohon Kelengkeng Diamond River"
                    placeholder="Masukkan jumlah pohon kelengkeng diamond river"
                    fullWidth
                    name="jml_pohon_diamond_river"
                    value={addRtData?.jml_pohon_diamond_river ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  {errors.jml_pohon_diamond_river && (
                    <p className="ml-3 text-sm text-red-600 font-inter">
                      {errors.jml_pohon_diamond_river}
                    </p>
                  )}
                  <Input
                    label="Pohon Kelengkeng Merah"
                    placeholder="Masukkan jumlah pohon kelengkeng merah"
                    fullWidth
                    name="jml_pohon_merah"
                    value={addRtData?.jml_pohon_merah ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  {errors.jml_pohon_merah && (
                    <p className="ml-3 text-sm text-red-600 font-inter">
                      {errors.jml_pohon_merah}
                    </p>
                  )}
                  <Input
                    label="Pohon Kelengkeng Belum Berproduksi"
                    placeholder="Masukkan jumlah pohon kelengkeng belum berproduksi"
                    fullWidth
                    name="jml_pohon_blm_berproduksi"
                    value={addRtData?.jml_pohon_blm_berproduksi ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  {errors.jml_pohon_blm_berproduksi && (
                    <p className="ml-3 text-sm text-red-600 font-inter">
                      {errors.jml_pohon_blm_berproduksi}
                    </p>
                  )}
                  <Input
                    label="Pohon Kelengkeng Sudah Berproduksi"
                    placeholder="Masukkan jumlah pohon kelengkeng sudah berproduksi"
                    fullWidth
                    name="jml_pohon_sdh_berproduksi"
                    value={addRtData?.jml_pohon_sdh_berproduksi ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  {errors.jml_pohon_sdh_berproduksi && (
                    <p className="ml-3 text-sm text-red-600 font-inter">
                      {errors.jml_pohon_sdh_berproduksi}
                    </p>
                  )}
                  <Input
                    label="Volume Produksi Agustus 2023-Juli 2024 (Kg)"
                    placeholder="Masukkan jumlah pohon kelengkeng sudah berproduksi"
                    fullWidth
                    name="volume_produksi"
                    value={addRtData?.volume_produksi ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  {errors.volume_produksi && (
                    <p className="ml-3 text-sm text-red-600 font-inter">
                      {errors.volume_produksi}
                    </p>
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="danger"
                  variant="light"
                  onPress={handleCloseButton}
                >
                  Tutup
                </Button>
                <Button
                  color="primary"
                  onPress={handleAddSave}
                  disabled={loading}
                  className="font-semibold text-white bg-blue-600"
                >
                  {loading ? (
                    <Bars
                      height="20"
                      width="20"
                      color="#ffffff"
                      ariaLabel="bars-loading"
                      visible={true}
                    />
                  ) : (
                    "Simpan"
                  )}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default AddRtModal;
