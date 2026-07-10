import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
} from "@nextui-org/react";
import { Bars } from "react-loader-spinner";

const FormModal = ({
  isOpen,
  onClose,
  selectedItem,
  formData,
  setFormData,
  onSubmit,
  loading,
  error,
  success,
  jenisKelaminOptions,
  statusPekerjaanOptions,
  bidangPekerjaanOptions,
}) => {
  const [ageError, setAgeError] = useState("");

  // Validasi umur minimal 15 tahun
  useEffect(() => {
    if (formData.umur && Number.parseInt(formData.umur) < 15) {
      setAgeError("Umur minimal harus 15 tahun");
    } else {
      setAgeError("");
    }
  }, [formData.umur]);

  useEffect(() => {
    if (formData.status_pekerjaan_utama === "Tidak Bekerja") {
      setFormData((prev) => ({
        ...prev,
        bidang_pekerjaan: "Tidak Bekerja",
      }));
    }
  }, [formData.status_pekerjaan_utama, setFormData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (ageError) {
      return;
    }
    onSubmit(e);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" backdrop="blur">
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>
            {selectedItem ? "Edit Data Pekerjaan" : "Tambah Data Pekerjaan"}
          </ModalHeader>
          <ModalBody>
            {error && (
              <div className="p-3 text-red-700 bg-red-100 border border-red-300 rounded-lg">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 text-green-700 bg-green-100 border border-green-300 rounded-lg">
                {success}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="RT"
                placeholder="Masukkan RT"
                type="number"
                value={formData.rt}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, rt: e.target.value }))
                }
                isRequired
              />
              <Input
                label="RW"
                placeholder="Masukkan RW"
                type="number"
                value={formData.rw}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, rw: e.target.value }))
                }
                isRequired
              />
              <Input
                label="Umur"
                placeholder="Masukkan umur (minimal 15 tahun)"
                type="number"
                min="15"
                value={formData.umur}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, umur: e.target.value }))
                }
                isRequired
                isInvalid={!!ageError}
                errorMessage={ageError}
                color={ageError ? "danger" : "default"}
              />
              <Select
                label="Jenis Kelamin"
                placeholder="Pilih jenis kelamin"
                selectedKeys={
                  formData.jenis_kelamin
                    ? new Set([formData.jenis_kelamin])
                    : new Set()
                }
                onSelectionChange={(keys) => {
                  const selectedValue = Array.from(keys)[0];
                  setFormData((prev) => ({
                    ...prev,
                    jenis_kelamin: selectedValue || "",
                  }));
                }}
                isRequired
              >
                {jenisKelaminOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </Select>
            </div>

            <Select
              label="Status Pekerjaan Utama"
              placeholder="Pilih status pekerjaan"
              selectedKeys={
                formData.status_pekerjaan_utama
                  ? new Set([formData.status_pekerjaan_utama])
                  : new Set()
              }
              onSelectionChange={(keys) => {
                const selectedValue = Array.from(keys)[0];
                setFormData((prev) => ({
                  ...prev,
                  status_pekerjaan_utama: selectedValue || "",
                }));
              }}
              isRequired
            >
              {statusPekerjaanOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </Select>

            <Select
              label="Bidang Pekerjaan"
              placeholder="Pilih bidang pekerjaan"
              selectedKeys={
                formData.bidang_pekerjaan
                  ? new Set([formData.bidang_pekerjaan])
                  : new Set()
              }
              onSelectionChange={(keys) => {
                const selectedValue = Array.from(keys)[0];
                setFormData((prev) => ({
                  ...prev,
                  bidang_pekerjaan: selectedValue || "",
                }));
              }}
              isRequired
              description="Pilih 'Tidak Bekerja' jika status pekerjaan adalah tidak bekerja"
            >
              {bidangPekerjaanOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </Select>

            <Input
              label="Nama Anggota"
              placeholder="Masukkan nama lengkap"
              value={formData.nama_anggota}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  nama_anggota: e.target.value,
                }))
              }
              isRequired
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>
              Batal
            </Button>
            <Button
              color="primary"
              type="submit"
              isLoading={loading}
              isDisabled={!!ageError}
              className="bg-green-600"
            >
              {loading ? (
                <Bars width="20" height="20" color="#ffffff" />
              ) : selectedItem ? (
                "Perbarui"
              ) : (
                "Simpan"
              )}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default FormModal;
