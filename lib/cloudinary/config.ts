// Remove the cloudinary import and use direct API calls only
export const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'secondsons'); // Create this preset in Cloudinary dashboard
  
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload image');
  }
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  // This would need to be done through an API route since it requires the secret
  console.log('Delete functionality needs to be implemented through API route');
};