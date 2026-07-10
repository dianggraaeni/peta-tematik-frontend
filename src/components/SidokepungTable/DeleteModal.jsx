import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@nextui-org/react";
import { Bars } from "react-loader-spinner";

const DeleteModal = ({ isOpen, onClose, selectedItem, onConfirm, loading }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>Konfirmasi Hapus</ModalHeader>
        <ModalBody>
          <p>
            Apakah Anda yakin ingin menghapus data{" "}
            <strong>{selectedItem?.nama_anggota}</strong>?
          </p>
          <p className="text-sm text-gray-600">
            Tindakan ini tidak dapat dibatalkan.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>
            Batal
          </Button>
          <Button color="danger" onPress={onConfirm} isLoading={loading}>
            {loading ? (
              <Bars width="20" height="20" color="#ffffff" />
            ) : (
              "Hapus"
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DeleteModal;
