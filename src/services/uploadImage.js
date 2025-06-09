import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

export async function uploadImage(file, path = "featuredProducts") {
  const storage = getStorage();
  const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

export async function deleteImageByUrl(url) {
  if (!url) return;
  try {
    const storage = getStorage();
    const fullPath = decodeURIComponent(new URL(url).pathname.split("/o/")[1].split("?")[0]);
    const storageRef = ref(storage, fullPath);
    await deleteObject(storageRef);
  } catch (err) {
    console.error("Erro ao remover imagem:", err);
  }
}
