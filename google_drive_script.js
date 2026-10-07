/**
 * =========================================================================
 * GOOGLE APPS SCRIPT — GOOGLE DRIVE AUTO-UPLOADER (DAPIN BY MECA)
 * =========================================================================
 * Folder Utama: https://drive.google.com/drive/folders/1n16zBrYGWbtQAomW0Si35TtGQ1mJjCJy?usp=sharing
 * 
 * CARA MEMASANG (HANYA 1 MENIT):
 * 1. Buka browser dan pergi ke: https://script.google.com/
 * 2. Klik tombol "+ New project" (Proyek Baru) di kiri atas.
 * 3. Hapus semua tulisan di editor, lalu TEMPELKAN (Paste) seluruh kode ini.
 * 4. Klik ikon Disket (Save) atau tekan Ctrl+S.
 * 5. Klik tombol biru "Deploy" di kanan atas -> pilih "New deployment".
 * 6. Di jendela yang muncul:
 *    - Klik ikon gerigi (Select type) -> pilih "Web app".
 *    - Description: "Dapin Google Drive Uploader".
 *    - Execute as: "Me" (email Google Anda).
 *    - Who has access: "Anyone" (PENTING: pilih Anyone agar peminjam bisa upload).
 * 7. Klik "Deploy".
 * 8. Jika Google meminta izin akun: Klik "Authorize access" -> Pilih akun Google Anda ->
 *    Klik "Advanced" (Lanjutan di kiri bawah) -> Klik "Go to Untitled project (unsafe)" -> Klik "Allow".
 * 9. Salin "Web app URL" (contoh: https://script.google.com/macros/s/AKfycbx.../exec).
 * 10. Tempelkan URL tersebut ke dalam file index.html pada variabel:
 *     const GOOGLE_DRIVE_WEBHOOK_URL = "URL_HASIL_DEPLOY_ANDA_DI_SINI";
 * =========================================================================
 */

var ROOT_FOLDER_ID = "1n16zBrYGWbtQAomW0Si35TtGQ1mJjCJy";

/**
 * PENTING: JALANKAN FUNGSI INI 1 KALI DI EDITOR GOOGLE APPS SCRIPT!
 * Klik tombol 'Jalankan' (Run ▶️) pada fungsi 'tesOtorisasiDrive' di atas editor,
 * lalu klik 'Tinjau Izin' -> Pilih Akun -> Lanjutan -> Izinkan (Allow).
 */
function tesOtorisasiDrive() {
  var folder = DriveApp.getFolderById(ROOT_FOLDER_ID);
  Logger.log("BERHASIL! Izin Google Drive aktif untuk folder: " + folder.getName());
}

function doGet(e) {
  return ContentService.createTextOutput("Google Drive Uploader Dapin by Meca Aktif! Folder Utama ID: " + ROOT_FOLDER_ID)
                       .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Data kosong" }))
                           .setMimeType(ContentService.MimeType.JSON);
    }

    var data = JSON.parse(e.postData.contents);
    var rootFolder = DriveApp.getFolderById(ROOT_FOLDER_ID);

    var applicantName = (data.fullName || "Pemohon").trim();
    var applicantPhone = (data.whatsappNumber || "").trim();
    var now = new Date();
    var timeStamp = Utilities.formatDate(now, "Asia/Jakarta", "dd-MM-yyyy_HH.mm");

    // 1. Buat Folder Baru Khusus Berdasarkan Nama Pemohon
    var folderName = applicantName + " - " + applicantPhone + " (" + timeStamp + ")";
    var applicantFolder = rootFolder.createFolder(folderName);
    applicantFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var fileUrls = {};
    var filesData = data.files || {};

    // 2. Simpan Ke-4 Berkas Persyaratan ke dalam Folder Pemohon
    var mapping = [
      { key: 'ktp', label: '1_Foto_KTP_Asli_' + applicantName },
      { key: 'selfie', label: '2_Selfie_KTP_' + applicantName },
      { key: 'kk', label: '3_Kartu_Keluarga_' + applicantName },
      { key: 'video', label: '4_Video_Pernyataan_' + applicantName }
    ];

    for (var i = 0; i < mapping.length; i++) {
      var item = mapping[i];
      var fileObj = filesData[item.key];
      if (fileObj && fileObj.base64) {
        var ext = (item.key === 'video') ? '.mp4' : '.jpg';
        if (fileObj.name && fileObj.name.indexOf('.') !== -1) {
          ext = fileObj.name.substring(fileObj.name.lastIndexOf('.'));
        }

        var decoded = Utilities.base64Decode(fileObj.base64);
        var mime = fileObj.mimeType || (item.key === 'video' ? 'video/mp4' : 'image/jpeg');
        var blob = Utilities.newBlob(decoded, mime, item.label + ext);
        var createdFile = applicantFolder.createFile(blob);
        createdFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        
        fileUrls[item.key] = createdFile.getUrl();
      }
    }

    var responsePayload = {
      status: "success",
      folderUrl: applicantFolder.getUrl(),
      files: fileUrls
    };

    return ContentService.createTextOutput(JSON.stringify(responsePayload))
                         .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
