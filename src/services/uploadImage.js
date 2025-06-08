import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

export async function uploadImage(file, path = "featuredProducts") {
  const storage = getStorage();
  const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}
