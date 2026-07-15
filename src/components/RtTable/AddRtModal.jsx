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

const AddRtModal = ({
  isAddModalOpen,
  onAddModalOpenChange,
  fetchData,
  fetchDataAggregate,
}) => {
  const [addRtData, setAddRtData] = useState({});
  const [loading, setLoading] = useState(false);

  // Reset data when modal opens
  useEffect(() => {
    if (isAddModalOpen) {
      setAddRtData({});
    }
  }, [isAddModalOpen]);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setAddRtData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleAddSave = () => {
    if (addRtData) {
      // Convert attributes to integers
      const convertedData = {
        ...addRtData,
        jml_ruta: parseInt(addRtData.jml_ruta, 10) || 0,
        jml_umkm: parseInt(addRtData.jml_umkm, 10) || 0,
        jml_umkm_kbli_a: parseInt(addRtData.jml_umkm_kbli_a, 10) || 0,
        jml_umkm_kbli_b: parseInt(addRtData.jml_umkm_kbli_b, 10) || 0,
        jml_umkm_kbli_c: parseInt(addRtData.jml_umkm_kbli_c, 10) || 0,
        jml_umkm_kbli_d: parseInt(addRtData.jml_umkm_kbli_d, 10) || 0,
        jml_umkm_kbli_e: parseInt(addRtData.jml_umkm_kbli_e, 10) || 0,
        jml_umkm_kbli_f: parseInt(addRtData.jml_umkm_kbli_f, 10) || 0,
        jml_umkm_kbli_g: parseInt(addRtData.jml_umkm_kbli_g, 10) || 0,
        jml_umkm_kbli_h: parseInt(addRtData.jml_umkm_kbli_h, 10) || 0,
        jml_umkm_kbli_i: parseInt(addRtData.jml_umkm_kbli_i, 10) || 0,
        jml_umkm_kbli_j: parseInt(addRtData.jml_umkm_kbli_j, 10) || 0,
        jml_umkm_kbli_k: parseInt(addRtData.jml_umkm_kbli_k, 10) || 0,
        jml_umkm_kbli_l: parseInt(addRtData.jml_umkm_kbli_l, 10) || 0,
        jml_umkm_kbli_m: parseInt(addRtData.jml_umkm_kbli_m, 10) || 0,
        jml_umkm_kbli_n: parseInt(addRtData.jml_umkm_kbli_n, 10) || 0,
        jml_umkm_kbli_o: parseInt(addRtData.jml_umkm_kbli_o, 10) || 0,
        jml_umkm_kbli_p: parseInt(addRtData.jml_umkm_kbli_p, 10) || 0,
        jml_umkm_kbli_q: parseInt(addRtData.jml_umkm_kbli_q, 10) || 0,
        jml_umkm_kbli_r: parseInt(addRtData.jml_umkm_kbli_r, 10) || 0,
        jml_umkm_kbli_s: parseInt(addRtData.jml_umkm_kbli_s, 10) || 0,
        jml_umkm_kbli_t: parseInt(addRtData.jml_umkm_kbli_t, 10) || 0,
        jml_umkm_kbli_u: parseInt(addRtData.jml_umkm_kbli_u, 10) || 0,
        jml_umkm_lokasi_bangunan_khusus_usaha: parseInt(
          addRtData.jml_umkm_lokasi_bangunan_khusus_usaha,
          10
        ) || 0,
        jml_umkm_lokasi_bangunan_campuran: parseInt(
          addRtData.jml_umkm_lokasi_bangunan_campuran,
          10
        ) || 0,
        jml_umkm_lokasi_kaki_lima: parseInt(
          addRtData.jml_umkm_lokasi_kaki_lima,
          10
        ) || 0,
        jml_umkm_lokasi_keliling: parseInt(
          addRtData.jml_umkm_lokasi_keliling,
          10
        ) || 0,
        jml_umkm_lokasi_didalam_bangunan_tempat_tinggal_online: parseInt(
          addRtData.jml_umkm_lokasi_didalam_bangunan_tempat_tinggal_online,
          10
        ) || 0,
        jml_umkm_bentuk_pt_persero_sejenisnya: parseInt(
          addRtData.jml_umkm_bentuk_pt_persero_sejenisnya,
          10
        ) || 0,
        jml_umkm_bentuk_ijin_desa_ijin_lainnya: parseInt(
          addRtData.jml_umkm_bentuk_ijin_desa_ijin_lainnya,
          10
        ) || 0,
        jml_umkm_bentuk_tidak_berbadan_hukum: parseInt(
          addRtData.jml_umkm_bentuk_tidak_berbadan_hukum,
          10
        ) || 0,
        jml_umkm_skala_usaha_mikro: parseInt(
          addRtData.jml_umkm_skala_usaha_mikro,
          10
        ) || 0,
        jml_umkm_skala_usaha_kecil: parseInt(
          addRtData.jml_umkm_skala_usaha_kecil,
          10
        ) || 0,
        jml_umkm_skala_usaha_menengah: parseInt(
          addRtData.jml_umkm_skala_usaha_menengah,
          10
        ) || 0,
      };
      console.log("Add data:", convertedData);
      addData(convertedData);
    }
  };

  const addData = async (data) => {
    setLoading(true);
    try {
      const response = await api.post(`/api/rt`, data);
      console.log("Data added:", response.data.data);
      message.success(`RT ${data.rt || 'baru'} berhasil ditambahkan.`, 5);
      onAddModalOpenChange(false); // Close the modal
      await fetchData(); // Fetch updated data
      await fetchDataAggregate();
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

  return (
    <>
      <Modal
        isOpen={isAddModalOpen}
        onOpenChange={onAddModalOpenChange}
        size="xl"
        className="bg-slate-100 font-inter max-h-[90%] my-auto"
        classNames={{
          header: "border-b-[1px] border-slate-300",
          footer: "border-t-[1px] border-slate-300",
          body: "overflow-y-auto",
          wrapper: "overflow-y-hidden",
        }}
      >
        <ModalContent className="font-inter text-pdarkblue">
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-white bg-slate-600">
                Tambah Rukun Tetangga (RT)
              </ModalHeader>
              <ModalBody className="py-4">
                <div className="space-y-4 simoanginangin-sls-edit">
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
                    placeholder="Masukkan dusun"
                    fullWidth
                    name="dusun"
                    value={addRtData?.dusun ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  <Input
                    label="Jumlah Keluarga"
                    placeholder="Masukkan jumlah keluarga"
                    fullWidth
                    name="jml_ruta"
                    value={addRtData?.jml_ruta ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  <Input
                    label="Jumlah UMKM"
                    placeholder="Masukkan jumlah UMKM"
                    fullWidth
                    name="jml_umkm"
                    value={addRtData?.jml_umkm ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  <Input
                    label="Jumlah UMKM Ketegori A"
                    placeholder="Masukkan jumlah UMKM kategori A"
                    fullWidth
                    name="jml_umkm_kbli_a"
                    value={addRtData?.jml_umkm_kbli_a ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  <Input
                    label="Jumlah UMKM Kategori B"
                    placeholder="Masukkan jumlah UMKM kategori B"
                    fullWidth
                    name="jml_umkm_kbli_b"
                    value={addRtData?.jml_umkm_kbli_b ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  <Input
                    label="Jumlah UMKM Kategori C"
                    placeholder="Masukkan jumlah UMKM kategori C"
                    fullWidth
                    name="jml_umkm_kbli_c"
                    value={addRtData?.jml_umkm_kbli_c ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  <Input
                    label="Jumlah UMKM Kategori D"
                    placeholder="Masukkan jumlah UMKM kategori D"
                    fullWidth
                    name="jml_umkm_kbli_d"
                    value={addRtData?.jml_umkm_kbli_d ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  <Input
                    label="Jumlah UMKM Kategori E"
                    placeholder="Masukkan jumlah UMKM kategori E"
                    fullWidth
                    name="jml_umkm_kbli_e"
                    value={addRtData?.jml_umkm_kbli_e ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  <Input
                    label="Jumlah UMKM Kategori F"
                    placeholder="Masukkan jumlah UMKM kategori F"
                    fullWidth
                    name="jml_umkm_kbli_f"
                    value={addRtData?.jml_umkm_kbli_f ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  <Input
                    label="Jumlah UMKM Kategori G"
                    placeholder="Masukkan jumlah UMKM KBLI G"
                    fullWidth
                    name="jml_umkm_kbli_g"
                    value={addRtData?.jml_umkm_kbli_g ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  <Input
                    label="Jumlah UMKM Kategori H"
                    placeholder="Masukkan jumlah UMKM kategori H"
                    fullWidth
                    name="jml_umkm_kbli_h"
                    value={addRtData?.jml_umkm_kbli_h ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  <Input
                    label="Jumlah UMKM Kategori I"
                    placeholder="Masukkan jumlah UMKM kategori I"
                    fullWidth
                    name="jml_umkm_kbli_i"
                    value={addRtData?.jml_umkm_kbli_i ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  <Input
                    label="Jumlah UMKM Kategori J"
                    placeholder="Masukkan jumlah UMKM kategori J"
                    fullWidth
                    name="jml_umkm_kbli_j"
                    value={addRtData?.jml_umkm_kbli_j ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  <Input
                    label="Jumlah UMKM Kategori K"
                    placeholder="Masukkan jumlah UMKM kategori K"
                    fullWidth
                    name="jml_umkm_kbli_k"
                    value={addRtData?.jml_umkm_kbli_k ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  <Input
                    label="Jumlah UMKM Kategori L"
                    placeholder="Masukkan jumlah UMKM kategori L"
                    fullWidth
                    name="jml_umkm_kbli_l"
                    value={addRtData?.jml_umkm_kbli_l ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  <Input
                    label="Jumlah UMKM Kategori M"
                    placeholder="Masukkan jumlah UMKM kategori M"
                    fullWidth
                    name="jml_umkm_kbli_m"
                    value={addRtData?.jml_umkm_kbli_m ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  <Input
                    label="Jumlah UMKM Kategori N"
                    placeholder="Masukkan jumlah UMKM kategori N"
                    fullWidth
                    name="jml_umkm_kbli_n"
                    value={addRtData?.jml_umkm_kbli_n ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  <Input
                    label="Jumlah UMKM Kategori O"
                    placeholder="Masukkan jumlah UMKM kategori O"
                    fullWidth
                    name="jml_umkm_kbli_o"
                    value={addRtData?.jml_umkm_kbli_o ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  <Input
                    label="Jumlah UMKM Kategori P"
                    placeholder="Masukkan jumlah UMKM kategori P"
                    fullWidth
                    name="jml_umkm_kbli_p"
                    value={addRtData?.jml_umkm_kbli_p ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  <Input
                    label="Jumlah UMKM Kategori Q"
                    placeholder="Masukkan jumlah UMKM kategori Q"
                    fullWidth
                    name="jml_umkm_kbli_q"
                    value={addRtData?.jml_umkm_kbli_q ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  <Input
                    label="Jumlah UMKM Kategori R"
                    placeholder="Masukkan jumlah UMKM kategori R"
                    fullWidth
                    name="jml_umkm_kbli_r"
                    value={addRtData?.jml_umkm_kbli_r ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  <Input
                    label="Jumlah UMKM Kategori S"
                    placeholder="Masukkan jumlah UMKM kategori S"
                    fullWidth
                    name="jml_umkm_kbli_s"
                    value={addRtData?.jml_umkm_kbli_s ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  <Input
                    label="Jumlah UMKM Kategori T"
                    placeholder="Masukkan jumlah UMKM kategori T"
                    fullWidth
                    name="jml_umkm_kbli_t"
                    value={addRtData?.jml_umkm_kbli_t ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  <Input
                    label="Jumlah UMKM Kategori U"
                    placeholder="Masukkan jumlah UMKM kategori U"
                    fullWidth
                    name="jml_umkm_kbli_u"
                    value={addRtData?.jml_umkm_kbli_u ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  <Input
                    label="Jumlah UMKM Bangunan Khusus Usaha"
                    placeholder="Masukkan jumlah UMKM bangunan khusus usaha"
                    fullWidth
                    name="jml_umkm_lokasi_bangunan_khusus_usaha"
                    value={addRtData?.jml_umkm_lokasi_bangunan_khusus_usaha ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  <Input
                    label="Jumlah UMKM Bangunan Campuran"
                    placeholder="Masukkan jumlah UMKM bangunan campuran"
                    fullWidth
                    name="jml_umkm_lokasi_bangunan_campuran"
                    value={addRtData?.jml_umkm_lokasi_bangunan_campuran ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  <Input
                    label="Jumlah UMKM Kaki Lima"
                    placeholder="Masukkan jumlah UMKM kaki lima"
                    fullWidth
                    name="jml_umkm_lokasi_kaki_lima"
                    value={addRtData?.jml_umkm_lokasi_kaki_lima ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  <Input
                    label="Jumlah UMKM Keliling"
                    placeholder="Masukkan jumlah UMKM keliling"
                    fullWidth
                    name="jml_umkm_lokasi_keliling"
                    value={addRtData?.jml_umkm_lokasi_keliling ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  <Input
                    label="Jumlah UMKM di Dalam Bangunan Tempat Tinggal atau Online"
                    placeholder="Masukkan jumlah UMKM di dalam bangunan tempat tinggal atau online"
                    fullWidth
                    name="jml_umkm_lokasi_didalam_bangunan_tempat_tinggal_online"
                    value={addRtData?.jml_umkm_lokasi_didalam_bangunan_tempat_tinggal_online ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  <Input
                    label="Jumlah UMKM PT/Persero/Sejenisnya"
                    placeholder="Masukkan jumlah UMKM PT/Persero/Sejenisnya"
                    fullWidth
                    name="jml_umkm_bentuk_pt_persero_sejenisnya"
                    value={addRtData?.jml_umkm_bentuk_pt_persero_sejenisnya ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  <Input
                    label="Jumlah UMKM Ijin Desa atau Ijin Lainnya"
                    placeholder="Masukkan jumlah UMKM ijin desa atau ijin lainnya"
                    fullWidth
                    name="jml_umkm_bentuk_ijin_desa_ijin_lainnya"
                    value={addRtData?.jml_umkm_bentuk_ijin_desa_ijin_lainnya ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  <Input
                    label="Jumlah UMKM Tidak Berbadan Hukum"
                    placeholder="Masukkan jumlah UMKM tidak berbadan hukum"
                    fullWidth
                    name="jml_umkm_bentuk_tidak_berbadan_hukum"
                    value={addRtData?.jml_umkm_bentuk_tidak_berbadan_hukum ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  <Input
                    label="Jumlah UMKM Mikro"
                    placeholder="Masukkan jumlah UMKM mikro"
                    fullWidth
                    name="jml_umkm_skala_usaha_mikro"
                    value={addRtData?.jml_umkm_skala_usaha_mikro ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  <Input
                    label="Jumlah UMKM Kecil"
                    placeholder="Masukkan jumlah UMKM kecil"
                    fullWidth
                    name="jml_umkm_skala_usaha_kecil"
                    value={addRtData?.jml_umkm_skala_usaha_kecil ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                  <Input
                    label="Jumlah UMKM Menengah"
                    placeholder="Masukkan jumlah UMKM menengah"
                    fullWidth
                    name="jml_umkm_skala_usaha_menengah"
                    value={addRtData?.jml_umkm_skala_usaha_menengah ?? ""}
                    onChange={handleEditChange}
                    classNames={{ inputWrapper: "shadow" }}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Tutup
                </Button>
                <Button
                  className="bg-[#0B588F] text-white font-inter font-semibold"
                  onPress={handleAddSave}
                  disabled={loading}
                >
                  {loading ? (
                    <Bars width="25" height="25" color="#ffffff" />
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
