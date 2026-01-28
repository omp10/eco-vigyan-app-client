import { Platform } from 'react-native';

export const uploadToCloudinary = async (imageUri: string) => {
  // Using specific cloud name and unsigned preset provided by user
  const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || "degy2dbyj"; 
  const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "mushrooms_unsigned";
  const apiKey = process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY;
  
  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary configuration missing");
  }

  const formData = new FormData();
  
  // @ts-ignore: FormData expects a Blob/File, but in RN we pass an object
  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'upload.jpg',
  });
  
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'mushrooms');
  if (apiKey) {
    formData.append('api_key', apiKey);
  }

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || "Upload failed");
    }

    return data;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};
