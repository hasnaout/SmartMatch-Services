import api from "./axios";

/**
 * Upload fichier unique
 * @param {File} file
 * @param {string} type — "avatar" | "portfolio" | "document"
 */
export const uploadFichier = async (file, type = "document") => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);

  const res = await api.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

/**
 * Upload multiple fichiers
 * @param {File[]} files
 */
export const uploadMultiple = async (files) => {
  const formData = new FormData();
  files.forEach((f) => formData.append("files", f));

  const res = await api.post("/upload/multiple", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};