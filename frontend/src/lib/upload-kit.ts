export async function uploadImageToImageKit(file: File) {
  const rawBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const apiBase = rawBase.endsWith("/api") ? rawBase : `${rawBase}/api`;

  // 1) Get signature
  const sigRes = await fetch(`${apiBase}/upload/signature`);
  if (!sigRes.ok) throw new Error("Failed to get ImageKit signature");
  const auth = await sigRes.json();

  // 2) Upload to ImageKit
  const formData = new FormData();
  formData.append("file", file);
  formData.append("fileName", file.name);               // ✅ required
  formData.append("publicKey", process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!);
  formData.append("signature", auth.signature);
  formData.append("expire", auth.expire.toString());
  formData.append("token", auth.token);
  formData.append("folder", "linkerly");                // ✅ no leading slash

  const uploadRes = await fetch(
    "https://upload.imagekit.io/api/v1/files/upload",
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await uploadRes.json();

  if (!uploadRes.ok) {
    console.error("UPLOAD ERROR =>", data);
    throw new Error(data?.message || "ImageKit upload failed");
  }
  console.log("ImageKit response:", data);
  return data.url as string;
}
