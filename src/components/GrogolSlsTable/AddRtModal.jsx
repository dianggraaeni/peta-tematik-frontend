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
import api4 from "../../utils/api4";

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
      case "total_usaha_sayuran":
      case "total_tanaman_kangkung":
      case "total_tanaman_bayam":
      case "total_tanaman_sawi":
      case "total_tanaman_kangkung_dijual_sendiri":
      case "total_tanaman_bayam_dijual_sendiri":
      case "total_tanaman_sawi_dijual_sendiri":
      case "total_tanaman_kangkung_dijual_ke_tengkulak":
      case "total_tanaman_bayam_dijual_ke_tengkulak":
      case "total_tanaman_sawi_dijual_ke_tengkulak":
        if (!value) {
          validationMessage = `Jumlah ${name.replace(/_/g, " ")} harus diisi.`;
        } else if (isNaN(value)) {
          validationMessage = `Jumlah ${name.replace(/_/g, " ")} harus berupa angka.`;
        } else if (Number(value) < 0) {
          validationMessage = `Jumlah ${name.replace(/_/g, " ")} harus berupa angka positif.`;
        } else if (!Number.isInteger(Number(value))) {
          validationMessage = `Jumlah ${name.replace(/_/g, " ")} harus berupa angka bulat.`;
        } else {
          validationMessage = "";
        }
        break;
      case "total_rata2_luas_tanam_kangkung":
      case "total_rata2_luas_tanam_bayam":
      case "total_rata2_luas_tanam_sawi":
      case "total_rata2_luas_panen_kangkung":
      case "total_rata2_luas_panen_bayam":
      case "total_rata2_luas_panen_sawi":
      case "total_rata2_volume_produksi_kangkung":
      case "total_rata2_volume_produksi_bayam":
      case "total_rata2_volume_produksi_sawi":
      case "total_rata2_nilai_produksi_kangkung":
      case "total_rata2_nilai_produksi_bayam":
      case "total_rata2_nilai_produksi_sawi":
        if (!value) {
          validationMessage = `Jumlah ${name.replace(/_/g, " ")} harus diisi.`;
        } else if (isNaN(value)) {
          validationMessage = `Jumlah ${name.replace(/_/g, " ")} harus berupa angka.`;
        } else if (Number(value) < 0) {
          validationMessage = `Jumlah ${name.replace(/_/g, " ")} harus berupa angka positif.`;
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
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: validationMessage,
    }));
  
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
  
  const hasErrors = (errors) => {
    // Iterate over the values of the errors object
    for (let key in errors) {
      // Check if the error message is not empty
      if (errors[key] !== "") {
        return true;
      }
    }
    return false;
  };

  const handleAddSave = () => {
    if (hasErrors(errors) || !validateForm(addRtData)) {
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
        total_usaha_sayuran: parseInt(addRtData.total_usaha_sayuran, 10) || 0,
        total_tanaman_kangkung: parseInt(addRtData.total_tanaman_kangkung, 10) || 0,
        total_tanaman_bayam: parseInt(addRtData.total_tanaman_bayam, 10) || 0,
        total_tanaman_sawi: parseInt(addRtData.total_tanaman_sawi, 10) || 0,
        total_rata2_luas_tanam_kangkung: parseFloat(addRtData.total_rata2_luas_tanam_kangkung) || 0,
        total_rata2_luas_tanam_bayam: parseFloat(addRtData.total_rata2_luas_tanam_bayam) || 0,
        total_rata2_luas_tanam_sawi: parseFloat(addRtData.total_rata2_luas_tanam_sawi) || 0,
        total_rata2_luas_panen_kangkung: parseFloat(addRtData.total_rata2_luas_panen_kangkung) || 0,
        total_rata2_luas_panen_bayam: parseFloat(addRtData.total_rata2_luas_panen_bayam) || 0,
        total_rata2_luas_panen_sawi: parseFloat(addRtData.total_rata2_luas_panen_sawi) || 0,
        total_rata2_volume_produksi_kangkung: parseFloat(addRtData.total_rata2_volume_produksi_kangkung) || 0,
        total_rata2_volume_produksi_bayam: parseFloat(addRtData.total_rata2_volume_produksi_bayam) || 0,
        total_rata2_volume_produksi_sawi: parseFloat(addRtData.total_rata2_volume_produksi_sawi) || 0,
        total_rata2_nilai_produksi_kangkung: parseFloat(addRtData.total_rata2_nilai_produksi_kangkung) || 0,
        total_rata2_nilai_produksi_bayam: parseFloat(addRtData.total_rata2_nilai_produksi_bayam) || 0,
        total_rata2_nilai_produksi_sawi: parseFloat(addRtData.total_rata2_nilai_produksi_sawi) || 0,
        total_tanaman_kangkung_dijual_sendiri: parseInt(addRtData.total_tanaman_kangkung_dijual_sendiri, 10) || 0,
        total_tanaman_bayam_dijual_sendiri: parseInt(addRtData.total_tanaman_bayam_dijual_sendiri, 10) || 0,
        total_tanaman_sawi_dijual_sendiri: parseInt(addRtData.total_tanaman_sawi_dijual_sendiri, 10) || 0,
        total_tanaman_kangkung_dijual_ke_tengkulak: parseInt(addRtData.total_tanaman_kangkung_dijual_ke_tengkulak, 10) || 0,
        total_tanaman_bayam_dijual_ke_tengkulak: parseInt(addRtData.total_tanaman_bayam_dijual_ke_tengkulak, 10) || 0,
        total_tanaman_sawi_dijual_ke_tengkulak: parseInt(addRtData.total_tanaman_sawi_dijual_ke_tengkulak, 10) || 0,
      };
      
      addData(convertedData);
    }
  };

  const addData = async (data) => {
    setLoading(true);
    try {
      const response = await api4.post(`/api/sls`, data);
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
                <div className="space-y-4 grogol-sls-edit">
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
                    disabled
                  />
                  <Input
                    label="RW"
                    placeholder="Masukkan RW"
                    fullWidth
                    name="rw"
                    value={addRtData?.rw ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                    disabled
                  />
                  <Input
                    label="Dusun"
                    placeholder="Masukkan Dusun"
                    fullWidth
                    name="dusun"
                    value={addRtData?.dusun ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                    disabled
                  />
                  <Input
                    label="Total Usaha Sayuran"
                    placeholder="Masukkan total usaha sayuran"
                    fullWidth
                    name="total_usaha_sayuran"
                    value={addRtData?.total_usaha_sayuran ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  {errors.total_usaha_sayuran && (
                    <p className="ml-3 text-sm text-red-600 font-inter">
                      {errors.total_usaha_sayuran}
                    </p>
                  )}
                  <Input
                    label="Total Tanaman Kangkung"
                    placeholder="Masukkan total tanaman kangkung"
                    fullWidth
                    name="total_tanaman_kangkung"
                    value={addRtData?.total_tanaman_kangkung ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  {errors.total_tanaman_kangkung && (
                    <p className="ml-3 text-sm text-red-600 font-inter">
                      {errors.total_tanaman_kangkung}
                    </p>
                  )}
                  <Input
                    label="Total Tanaman Bayam"
                    placeholder="Masukkan total tanaman bayam"
                    fullWidth
                    name="total_tanaman_bayam"
                    value={addRtData?.total_tanaman_bayam ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  {errors.total_tanaman_bayam && (
                    <p className="ml-3 text-sm text-red-600 font-inter">
                      {errors.total_tanaman_bayam}
                    </p>
                  )}
                  <Input
                    label="Total Tanaman Sawi"
                    placeholder="Masukkan total tanaman sawi"
                    fullWidth
                    name="total_tanaman_sawi"
                    value={addRtData?.total_tanaman_sawi ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  {errors.total_tanaman_sawi && (
                    <p className="ml-3 text-sm text-red-600 font-inter">
                      {errors.total_tanaman_sawi}
                    </p>
                  )}
                  <Input
                    label="Total Luas Tanam Kangkung (m²)"
                    placeholder="Masukkan total luas tanam kangkung (m²)"
                    fullWidth
                    name="total_rata2_luas_tanam_kangkung"
                    value={addRtData?.total_rata2_luas_tanam_kangkung ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  {errors.total_rata2_luas_tanam_kangkung && (
                    <p className="ml-3 text-sm text-red-600 font-inter">
                      {errors.total_rata2_luas_tanam_kangkung}
                    </p>
                  )}
                  <Input
                    label="Total Luas Tanam Bayam (m²)"
                    placeholder="Masukkan total luas tanam bayam (m²)"
                    fullWidth
                    name="total_rata2_luas_tanam_bayam"
                    value={addRtData?.total_rata2_luas_tanam_bayam ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  {errors.total_rata2_luas_tanam_bayam && (
                    <p className="ml-3 text-sm text-red-600 font-inter">
                      {errors.total_rata2_luas_tanam_bayam}
                    </p>
                  )}
                  <Input
                    label="Total Luas Tanam Sawi (m²)"
                    placeholder="Masukkan total luas tanam sawi (m²)"
                    fullWidth
                    name="total_rata2_luas_tanam_sawi"
                    value={addRtData?.total_rata2_luas_tanam_sawi ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  {errors.total_rata2_luas_tanam_sawi && (
                    <p className="ml-3 text-sm text-red-600 font-inter">
                      {errors.total_rata2_luas_tanam_sawi}
                    </p>
                  )}
                  <Input
                    label="Total Luas Panen Kangkung (m²)"
                    placeholder="Masukkan total luas panen kangkung (m²)"
                    fullWidth
                    name="total_rata2_luas_panen_kangkung"
                    value={addRtData?.total_rata2_luas_panen_kangkung ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  {errors.total_rata2_luas_panen_kangkung && (
                    <p className="ml-3 text-sm text-red-600 font-inter">
                      {errors.total_rata2_luas_panen_kangkung}
                    </p>
                  )}
                  <Input
                    label="Total Luas Panen Bayam (m²)"
                    placeholder="Masukkan total luas panen bayam (m²)"
                    fullWidth
                    name="total_rata2_luas_panen_bayam"
                    value={addRtData?.total_rata2_luas_panen_bayam ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  {errors.total_rata2_luas_panen_bayam && (
                    <p className="ml-3 text-sm text-red-600 font-inter">
                      {errors.total_rata2_luas_panen_bayam}
                    </p>
                  )}
                  <Input
                    label="Total Luas Panen Sawi (m²)"
                    placeholder="Masukkan total luas panen sawi (m²)"
                    fullWidth
                    name="total_rata2_luas_panen_sawi"
                    value={addRtData?.total_rata2_luas_panen_sawi ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  {errors.total_rata2_luas_panen_sawi && (
                    <p className="ml-3 text-sm text-red-600 font-inter">
                      {errors.total_rata2_luas_panen_sawi}
                    </p>
                  )}
                  <Input
                    label="Total Volume Produksi Kangkung (kg)"
                    placeholder="Masukkan total volume produksi kangkung (kg)"
                    fullWidth
                    name="total_rata2_volume_produksi_kangkung"
                    value={
                      addRtData?.total_rata2_volume_produksi_kangkung ?? ""
                    }
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  {errors.total_rata2_volume_produksi_kangkung && (
                    <p className="ml-3 text-sm text-red-600 font-inter">
                      {errors.total_rata2_volume_produksi_kangkung}
                    </p>
                  )}
                  <Input
                    label="Total Volume Produksi Bayam (kg)"
                    placeholder="Masukkan total volume produksi bayam (kg)"
                    fullWidth
                    name="total_rata2_volume_produksi_bayam"
                    value={addRtData?.total_rata2_volume_produksi_bayam ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  {errors.total_rata2_volume_produksi_bayam && (
                    <p className="ml-3 text-sm text-red-600 font-inter">
                      {errors.total_rata2_volume_produksi_bayam}
                    </p>
                  )}
                  <Input
                    label="Total Volume Produksi Sawi (kg)"
                    placeholder="Masukkan total volume produksi sawi (kg)"
                    fullWidth
                    name="total_rata2_volume_produksi_sawi"
                    value={addRtData?.total_rata2_volume_produksi_sawi ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  {errors.total_rata2_volume_produksi_sawi && (
                    <p className="ml-3 text-sm text-red-600 font-inter">
                      {errors.total_rata2_volume_produksi_sawi}
                    </p>
                  )}
                  <Input
                    label="Total Nilai Produksi Kangkung (Rp)"
                    placeholder="Masukkan total nilai produksi kangkung (Rp)"
                    fullWidth
                    name="total_rata2_nilai_produksi_kangkung"
                    value={
                      addRtData?.total_rata2_nilai_produksi_kangkung ?? ""
                    }
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  {errors.total_rata2_nilai_produksi_kangkung && (
                    <p className="ml-3 text-sm text-red-600 font-inter">
                      {errors.total_rata2_nilai_produksi_kangkung}
                    </p>
                  )}
                  <Input
                    label="Total Nilai Produksi Bayam (Rp)"
                    placeholder="Masukkan total nilai produksi bayam (Rp)"
                    fullWidth
                    name="total_rata2_nilai_produksi_bayam"
                    value={addRtData?.total_rata2_nilai_produksi_bayam ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  {errors.total_rata2_nilai_produksi_bayam && (
                    <p className="ml-3 text-sm text-red-600 font-inter">
                      {errors.total_rata2_nilai_produksi_bayam}
                    </p>
                  )}
                  <Input
                    label="Total Nilai Produksi Sawi (Rp)"
                    placeholder="Masukkan total nilai produksi sawi (Rp)"
                    fullWidth
                    name="total_rata2_nilai_produksi_sawi"
                    value={addRtData?.total_rata2_nilai_produksi_sawi ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  {errors.total_rata2_nilai_produksi_sawi && (
                    <p className="ml-3 text-sm text-red-600 font-inter">
                      {errors.total_rata2_nilai_produksi_sawi}
                    </p>
                  )}
                  <Input
                    label="Total Tanaman Kangkung Dijual Sendiri (kg)"
                    placeholder="Masukkan total tanaman kangkung dijual sendiri (kg)"
                    fullWidth
                    name="total_tanaman_kangkung_dijual_sendiri"
                    value={
                      addRtData?.total_tanaman_kangkung_dijual_sendiri ?? ""
                    }
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  {errors.total_tanaman_kangkung_dijual_sendiri && (
                    <p className="ml-3 text-sm text-red-600 font-inter">
                      {errors.total_tanaman_kangkung_dijual_sendiri}
                    </p>
                  )}
                  <Input
                    label="Total Tanaman Bayam Dijual Sendiri (kg)"
                    placeholder="Masukkan total tanaman bayam dijual sendiri (kg)"
                    fullWidth
                    name="total_tanaman_bayam_dijual_sendiri"
                    value={addRtData?.total_tanaman_bayam_dijual_sendiri ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  {errors.total_tanaman_bayam_dijual_sendiri && (
                    <p className="ml-3 text-sm text-red-600 font-inter">
                      {errors.total_tanaman_bayam_dijual_sendiri}
                    </p>
                  )}
                  <Input
                    label="Total Tanaman Sawi Dijual Sendiri (kg)"
                    placeholder="Masukkan total tanaman sawi dijual sendiri (kg)"
                    fullWidth
                    name="total_tanaman_sawi_dijual_sendiri"
                    value={addRtData?.total_tanaman_sawi_dijual_sendiri ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  {errors.total_tanaman_sawi_dijual_sendiri && (
                    <p className="ml-3 text-sm text-red-600 font-inter">
                      {errors.total_tanaman_sawi_dijual_sendiri}
                    </p>
                  )}
                  <Input
                    label="Total Tanaman Kangkung Dijual ke Tengkulak (kg)"
                    placeholder="Masukkan total tanaman kangkung dijual ke tengkulak (kg)"
                    fullWidth
                    name="total_tanaman_kangkung_dijual_ke_tengkulak"
                    value={
                      addRtData?.total_tanaman_kangkung_dijual_ke_tengkulak ??
                      ""
                    }
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  {errors.total_tanaman_kangkung_dijual_ke_tengkulak && (
                    <p className="ml-3 text-sm text-red-600 font-inter">
                      {errors.total_tanaman_kangkung_dijual_ke_tengkulak}
                    </p>
                  )}
                  <Input
                    label="Total Tanaman Bayam Dijual ke Tengkulak (kg)"
                    placeholder="Masukkan total tanaman bayam dijual ke tengkulak (kg)"
                    fullWidth
                    name="total_tanaman_bayam_dijual_ke_tengkulak"
                    value={
                      addRtData?.total_tanaman_bayam_dijual_ke_tengkulak ?? ""
                    }
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  {errors.total_tanaman_bayam_dijual_ke_tengkulak && (
                    <p className="ml-3 text-sm text-red-600 font-inter">
                      {errors.total_tanaman_bayam_dijual_ke_tengkulak}
                    </p>
                  )}
                  <Input
                    label="Total Tanaman Sawi Dijual ke Tengkulak (kg)"
                    placeholder="Masukkan total tanaman sawi dijual ke tengkulak (kg)"
                    fullWidth
                    name="total_tanaman_sawi_dijual_ke_tengkulak"
                    value={
                      addRtData?.total_tanaman_sawi_dijual_ke_tengkulak ?? ""
                    }
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  {errors.total_tanaman_sawi_dijual_ke_tengkulak && (
                    <p className="ml-3 text-sm text-red-600 font-inter">
                      {errors.total_tanaman_sawi_dijual_ke_tengkulak}
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
