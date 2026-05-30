import { Platform } from "react-native";
import { apiGetUploadUrl } from "./api";

export const BASE_URL =
  Platform.OS === "web"
    ? ""
    : `https://${process.env.EXPO_PUBLIC_DOMAIN ?? "localhost"}/api`;

export function getObjectUrl(objectPath: string): string {
  if (objectPath.startsWith("http")) return objectPath;
  const clean = objectPath.startsWith("/") ? objectPath : `/${objectPath}`;
  return `${BASE_URL}${clean}`;
}

export async function uploadFile(
  localUri: string,
  filename: string,
  contentType: string,
): Promise<string> {
  const { presignedUrl, objectPath } = await apiGetUploadUrl(filename, contentType);

  if (Platform.OS === "web") {
    const response = await fetch(localUri);
    const blob = await response.blob();
    await fetch(presignedUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: blob,
    });
  } else {
    const response = await fetch(localUri);
    const blob = await response.blob();
    await fetch(presignedUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: blob,
    });
  }

  return objectPath;
}
