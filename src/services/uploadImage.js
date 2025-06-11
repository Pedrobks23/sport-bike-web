

async function resizeImage(file, maxSize = 1280) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => resolve(blob || file), "image/jpeg", 0.8);
    };
    img.src = URL.createObjectURL(file);
  });
}

export async function uploadImage(file, path = "featuredProducts") {
  const storage = getStorage();
  const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
  const resized = await resizeImage(file);
  await uploadBytes(storageRef, resized);
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
