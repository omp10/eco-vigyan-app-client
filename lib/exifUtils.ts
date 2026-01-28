// Basic EXIF extraction stub - Expo ImagePicker returns basic EXIF
// Use this if you need more advanced extraction
import * as FileSystem from 'expo-file-system';

export const extractExifData = async (file: any) => {
  // In React Native with Expo Image Picker, EXIF is usually returned with the asset
  // This is a placeholder standardizer
  
  if (file.exif) {
    // Parse GPS if available
    const gps = file.exif.GPSLatitude && file.exif.GPSLongitude ? {
      latitude: file.exif.GPSLatitude * (file.exif.GPSLatitudeRef === 'S' ? -1 : 1),
      longitude: file.exif.GPSLongitude * (file.exif.GPSLongitudeRef === 'W' ? -1 : 1),
    } : null;
    
    // Parse Date/Time
    // Format usually: "2023:05:21 15:30:00"
    let dateTime = null;
    if (file.exif.DateTimeOriginal || file.exif.DateTime) {
      const dateStr = file.exif.DateTimeOriginal || file.exif.DateTime;
      const parts = dateStr.split(' ');
      if (parts.length >= 2) {
        const dateParts = parts[0].split(':');
        const timeParts = parts[1].split(':');
        if (dateParts.length === 3 && timeParts.length === 3) {
          dateTime = new Date(
            parseInt(dateParts[0]),
            parseInt(dateParts[1]) - 1,
            parseInt(dateParts[2]),
            parseInt(timeParts[0]),
            parseInt(timeParts[1]),
            parseInt(timeParts[2])
          );
        }
      }
    }

    return { gps, dateTime };
  }
  
  return { gps: null, dateTime: null };
};
