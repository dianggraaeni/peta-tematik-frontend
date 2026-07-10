import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Progress,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
} from "@nextui-org/react";
import { AiOutlineUpload } from "react-icons/ai";

const UploadModal = ({
  isOpen,
  onClose,
  previewData,
  uploadProgress,
  isUploading,
  uploadResults,
  error,
  onUpload,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="5xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>
          <div className="flex items-center gap-2">
            <AiOutlineUpload />
            Preview Data Upload
          </div>
        </ModalHeader>
        <ModalBody>
          {error && (
            <div className="p-3 text-red-700 bg-red-100 border border-red-300 rounded-lg mb-4">
              {error}
            </div>
          )}

          {isUploading && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Mengupload data...</span>
                <span className="text-sm text-gray-500">
                  {Math.round(uploadProgress)}%
                </span>
              </div>
              <Progress value={uploadProgress} color="primary" />
            </div>
          )}

          {uploadResults && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">Hasil Upload:</h4>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="text-green-600">
                  ✅ Berhasil: {uploadResults.success} data
                </div>
                <div className="text-red-600">
                  ❌ Gagal: {uploadResults.failed} data
                </div>
              </div>
              {uploadResults.errors.length > 0 && (
                <div>
                  <h5 className="font-medium text-red-600 mb-2">
                    Error Details:
                  </h5>
                  <div className="max-h-32 overflow-y-auto text-sm">
                    {uploadResults.errors.map((err, idx) => (
                      <div key={idx} className="text-red-600">
                        Baris {err.row} ({err.name}): {err.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold">
                Data yang akan diupload ({previewData.length} baris)
              </h4>
              <div className="text-sm text-gray-600">
                Valid: {previewData.filter((item) => item._isValid).length} |
                Error: {previewData.filter((item) => !item._isValid).length}
              </div>
            </div>

            <div className="max-h-96 overflow-auto border rounded-lg">
              <Table aria-label="Preview Data">
                <TableHeader>
                  <TableColumn>BARIS</TableColumn>
                  <TableColumn>NAMA</TableColumn>
                  <TableColumn>DUSUN</TableColumn>
                  <TableColumn>RT/RW</TableColumn>
                  <TableColumn>UMUR</TableColumn>
                  <TableColumn>JENIS KELAMIN</TableColumn>
                  <TableColumn>STATUS PEKERJAAN</TableColumn>
                  <TableColumn>BIDANG PEKERJAAN</TableColumn>{" "}
                  <TableColumn>STATUS</TableColumn>
                </TableHeader>
                <TableBody>
                  {previewData.map((item, index) => (
                    <TableRow
                      key={index}
                      className={!item._isValid ? "bg-red-50" : ""}
                    >
                      <TableCell>{item._index}</TableCell>
                      <TableCell>{item.nama_anggota}</TableCell>
                      <TableCell>{item.dusun || "Belum Diset"}</TableCell>
                      <TableCell>
                        {item.rt}/{item.rw}
                      </TableCell>
                      <TableCell>{item.umur}</TableCell>
                      <TableCell>{item.jenis_kelamin}</TableCell>
                      <TableCell>{item.status_pekerjaan_utama}</TableCell>
                      <TableCell>
                        {item.bidang_pekerjaan || "Tidak Diset"}
                      </TableCell>
                      <TableCell>
                        {item._isValid ? (
                          <Chip color="success" size="sm">
                            Valid
                          </Chip>
                        ) : (
                          <Chip
                            color="danger"
                            size="sm"
                            title={`Error: ${item._errors.join(", ")}`}
                          >
                            Error
                          </Chip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose} isDisabled={isUploading}>
            Batal
          </Button>
          <Button
            color="primary"
            onPress={onUpload}
            isLoading={isUploading}
            isDisabled={
              previewData.filter((item) => item._isValid).length === 0
            }
            className="bg-green-600"
          >
            {isUploading
              ? "Mengupload..."
              : `Upload ${
                  previewData.filter((item) => item._isValid).length
                } Data Valid`}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UploadModal;
