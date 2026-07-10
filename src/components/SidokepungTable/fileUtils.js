export const downloadTemplate = (onSuccess) => {
  const template = [
    {
      rt: "1",
      rw: "2",
      umur: "30",
      jenis_kelamin: "Laki-laki",
      status_pekerjaan_utama: "Wiraswasta",
      bidang_pekerjaan: "Jasa lainnya",
      nama_anggota: "Contoh Nama",
    },
  ];

  // CSV Template
  const csvHeaders =
    "rt,rw,umur,jenis_kelamin,status_pekerjaan_utama,bidang_pekerjaan, nama_anggota\n";
  const csvRow =
    "1,2,30,Laki-laki,Berusaha sendiri, Jasa lainnya, Contoh Nama\n";
  const csvContent = csvHeaders + csvRow;

  const csvBlob = new Blob([csvContent], { type: "text/csv" });
  const csvUrl = URL.createObjectURL(csvBlob);
  const csvLink = document.createElement("a");
  csvLink.href = csvUrl;
  csvLink.download = "template_data_pekerjaan.csv";
  csvLink.click();

  // JSON Template
  const jsonContent = JSON.stringify(template, null, 2);
  const jsonBlob = new Blob([jsonContent], { type: "application/json" });
  const jsonUrl = URL.createObjectURL(jsonBlob);
  const jsonLink = document.createElement("a");
  jsonLink.href = jsonUrl;
  jsonLink.download = "template_data_pekerjaan.json";
  jsonLink.click();

  onSuccess("Template CSV dan JSON berhasil didownload");
};
