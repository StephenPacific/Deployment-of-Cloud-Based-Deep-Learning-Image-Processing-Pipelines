import torch
from torch.utils.data import Dataset

from skimage.io import imsave
from scipy.ndimage import zoom
from tqdm import tqdm
import random
import os
import tifffile
import h5py
import glob
import re
import numpy as np
from skimage.io import imread
from typing import Tuple, Union
#%%

def read_image(path_image: str) -> np.ndarray:
    """
    Read a 3D image from a TIFF file (.tif, .tiff) or HDF5 file (.h5).

    Args:
        path_image (str): Path to the image file.

    Returns:
        np.ndarray: 3D NumPy array (D, H, W) of type float32.
    """
    ext = os.path.splitext(path_image)[-1].lower()

    if ext in [".tif", ".tiff"]:
        image = tifffile.imread(path_image)

    elif ext == ".h5":
        with h5py.File(path_image, "r") as f:
            # Try "data" first, fallback to "image" if needed
            dataset_name = "data" if "data" in f else "image"
            image = f[dataset_name][:]
   
    elif ext == ".png":
        image = imread(path_image)
            
    else:
        raise ValueError(f"Unsupported file extension: {ext}")

    return image

def get_sorted_list_slices_paths(folder_path, extension, return_slice_num=True):
    """
    Get a list of checkpoint file paths sorted by the number in the filename.

    Args:
        folder_path (str): Folder containing checkpoint files.
        extension (str): File extension to filter by (default=".pt").
        return_slice_num (bool): Whether to return the extracted slice numbers.

    Returns:
        tuple: (sorted_file_paths, sorted_slice_numbers) if return_slice_num else (sorted_file_paths, None)
    """
    if not extension:
        extension = ""
    
    pattern = os.path.join(folder_path, f"*{extension}")
    all_files = glob.glob(pattern)

    def extract_number(filename):
        base = os.path.basename(filename)
        match = re.search(r"(\d+)", base)
        return int(match.group(1)) if match else float("inf")

    sorted_files = sorted(all_files, key=extract_number)
    
    if return_slice_num:
        slice_num_list = [extract_number(path) for path in sorted_files]
        return sorted_files, slice_num_list
    else:
        return sorted_files, None

class TrainDatasetFromFolder(Dataset):
    def __init__(self, InImages_dir, OutImages_dir, images_ext=""):
        super(TrainDatasetFromFolder, self).__init__()
        self.path_list_InImages, _ = get_sorted_list_slices_paths(folder_path=InImages_dir, 
                                                                  extension=images_ext, 
                                                                  return_slice_num=False)
        self.path_list_OutImages_dir, _ = get_sorted_list_slices_paths(folder_path=OutImages_dir, 
                                                                       extension=images_ext, 
                                                                       return_slice_num=False)
        assert len(self.path_list_InImages) == len(self.path_list_OutImages_dir), \
        "Full and ROI image directories must contain the same number of images."

    def __getitem__(self, index):
        
        InImage = read_image(path_image=self.path_list_InImages[index])
        OutImage = read_image(path_image=self.path_list_OutImages_dir[index])
        return InImage, OutImage 

    def __len__(self):
        return len(self.path_list_InImages)
    
def single_random_crop(image_3d_lr: Union[torch.Tensor, np.ndarray],
                       image_3d_hr: Union[torch.Tensor, np.ndarray],
                       scale: int,
                       crop_size_lr: Union[Tuple[int, int], Tuple[int, int, int]]) -> Union[Tuple[torch.Tensor, torch.Tensor], Tuple[torch.Tensor, torch.Tensor, str, int]]:
    """
    Perform a random aligned crop between full-resolution and ROI images.

    - If crop_size_full is 2D, performs a 2D crop along a random axis ('d', 'h', or 'w').
    - If crop_size_full is 3D, performs a standard 3D crop.

    Args:
        image_3d_lr (Tensor or ndarray): Low-resolution 3D image (D, H, W).
        image_3d_hr  (Tensor or ndarray): High-resolution ROI image (D, H, W).
        scale (int): Upscaling factor between image_3d_lr and image_3d_hr.
        crop_size_full (tuple): Either (H, W) for 2D crop or (D, H, W) for 3D crop.

    Returns:
        2D crop: (crop_lr, crop_hr)
        3D crop: (crop_lr, crop_hr)
    """
    if isinstance(image_3d_lr, np.ndarray):
        image_3d_lr = torch.from_numpy(image_3d_lr)
    if isinstance(image_3d_hr, np.ndarray):
        image_3d_hr = torch.from_numpy(image_3d_hr)

    assert image_3d_lr.ndim == 3 and image_3d_hr.ndim == 3, "Images must be 3D"

    D, H, W = image_3d_lr.shape

    if len(crop_size_lr) == 2:
        h_crop, w_crop = crop_size_lr
        axis = random.choice(['d', 'h', 'w'])
        # axis = 'd'
        if axis == 'd':
            d_idx = torch.randint(0, D, (1,)).item()
            h_start = torch.randint(0, H - h_crop + 1, (1,)).item()
            w_start = torch.randint(0, W - w_crop + 1, (1,)).item()

            crop_lr = image_3d_lr[d_idx, h_start:h_start + h_crop, w_start:w_start + w_crop]
            crop_hr = image_3d_hr[d_idx * scale, h_start * scale:(h_start + h_crop) * scale, w_start * scale:(w_start + w_crop) * scale]

            return crop_lr, crop_hr

        elif axis == 'h':
            # max_h_idx = (image_3d_hr.shape[1] - 1) // scale
            # h_idx = torch.randint(0, max_h_idx + 1, (1,)).item()

            h_idx = torch.randint(0, H, (1,)).item()
            
            d_start = torch.randint(0, D - h_crop + 1, (1,)).item()
            w_start = torch.randint(0, W - w_crop + 1, (1,)).item()

            crop_lr = image_3d_lr[d_start:d_start + h_crop, h_idx, w_start:w_start + w_crop]
            crop_hr = image_3d_hr[d_start * scale:(d_start + h_crop) * scale, h_idx * scale, w_start * scale:(w_start + w_crop) * scale]

            return crop_lr, crop_hr

        elif axis == 'w':
            # max_w_idx = (image_3d_hr.shape[2] - 1) // scale
            # w_idx = torch.randint(0, max_w_idx + 1, (1,)).item()

            w_idx = torch.randint(0, W, (1,)).item()
            d_start = torch.randint(0, D - h_crop + 1, (1,)).item()
            h_start = torch.randint(0, H - w_crop + 1, (1,)).item()

            crop_lr = image_3d_lr[d_start:d_start + h_crop, h_start:h_start + w_crop, w_idx]
            crop_hr = image_3d_hr[d_start * scale:(d_start + h_crop) * scale, h_start * scale:(h_start + w_crop) * scale, w_idx * scale]

            return crop_lr, crop_hr

    elif len(crop_size_lr) == 3:
        d_crop, h_crop, w_crop = crop_size_lr
        assert D >= d_crop and H >= h_crop and W >= w_crop, "Crop size exceeds image dimensions"

        d_start = torch.randint(0, D - d_crop + 1, (1,)).item()
        h_start = torch.randint(0, H - h_crop + 1, (1,)).item()
        w_start = torch.randint(0, W - w_crop + 1, (1,)).item()

        crop_lr = image_3d_lr[d_start:d_start + d_crop,
                               h_start:h_start + h_crop,
                               w_start:w_start + w_crop]
        
        crop_hr = image_3d_hr[
            d_start * scale:(d_start + d_crop) * scale,
            h_start * scale:(h_start + h_crop) * scale,
            w_start * scale:(w_start + w_crop) * scale,
        ]

        return crop_lr, crop_hr

    else:
        raise ValueError("crop_size_lr must be a 2D or 3D tuple")

def adjust_lr_voxel_size(image_3d_lr, voxel_size_lr, voxel_size_hr):
    """
    Rescales a 3D image so that the voxel size is an integer multiple of the target voxel size.
    
    Parameters:
        image_3d_lr (np.ndarray): The low-resolution 3D image.
        voxel_size_lr (float): Voxel size of the low-resolution image.
        voxel_size_hr (float): Target voxel size of the high-resolution image.
    
    Returns:
        image_3d_lr (np.ndarray): Rescaled image if rescaling was required.
        scale (int): Final integer scale factor between voxel sizes.
    """
    scale = voxel_size_lr / voxel_size_hr
    adjusted_voxel_size = voxel_size_lr
    
    if not scale.is_integer():
        target_scale = round(scale)
        rescale_factor = target_scale / scale
        #zoom_factors = [rescale_factor] * 3  # Apply same rescaling on D, H, W
        zoom_factors = [1/rescale_factor] * 3
        if rescale_factor != 1:
            image_3d_lr = zoom(image_3d_lr, zoom_factors, order=3)  # Bicubic interpolation
            adjusted_voxel_size = voxel_size_lr * rescale_factor
            
        scale = target_scale
    return image_3d_lr, int(scale), adjusted_voxel_size

def multi_random_crop(image_3d_lr: Union[torch.Tensor, np.ndarray],
                      image_3d_hr: Union[torch.Tensor, np.ndarray],
                      scale : int,
                      crop_size_lr: Union[Tuple[int, int], Tuple[int, int, int]],
                      num_lr_crops: int,
                      save_dir_crop_lr: str,
                      save_dir_crop_hr: str,
                      base_filename_full: str = "crop_lr",
                      base_filename_roi: str = "crop_hr") -> None:
    """
    Perform multiple random aligned crops and save them as .h5 files.

    Args:
        image_3d_lr (Tensor or ndarray): Full-resolution 3D image (D, H, W).
        image_3d_hr (Tensor or ndarray): ROI image (D, H, W).
        scale (int): Scale factor.
        voxel_size_roi (float): Voxel size in ROI image.
        crop_size_lr (tuple): Crop size in full image space.
        num_lr_crops (int): Number of random crops to generate.
        save_dir_crop_lr (str): Directory to save full image crops.
        save_dir_crop_hr (str): Directory to save ROI crops.
        base_filename_full (str): Prefix for saved full image files.
        base_filename_roi (str): Prefix for saved ROI image files.
    """
    
    assert image_3d_lr.ndim == 3 and image_3d_hr.ndim == 3, "Both images must be 3D"
    assert num_lr_crops > 0, "num_lr_crops must be positive"
    
    if isinstance(image_3d_lr, torch.Tensor):
        image_3d_lr = image_3d_lr.numpy()
    if isinstance(image_3d_hr, torch.Tensor):
        image_3d_hr = image_3d_hr.numpy()
    

    for i in tqdm(range(num_lr_crops), desc="Generating Random Crops"):
        crop_lr, crop_hr = single_random_crop(image_3d_lr=image_3d_lr,
                                              image_3d_hr=image_3d_hr,
                                              scale=scale,
                                              crop_size_lr=crop_size_lr)


        crop_lr = crop_lr.numpy().astype(np.uint8) if isinstance(crop_lr, torch.Tensor) else crop_lr.astype(np.uint8)
        crop_hr = crop_hr.numpy().astype(np.uint8) if isinstance(crop_hr, torch.Tensor) else crop_hr.astype(np.uint8)
        
        # file_path_full = os.path.join(save_dir_crop_lr, f"{base_filename_full}_{i:03d}.h5")
        # file_path_roi = os.path.join(save_dir_crop_hr, f"{base_filename_roi}_{i:03d}.h5")

        # with h5py.File(file_path_full, "w") as f:
        #     f.create_dataset("data", data=crop_lr.numpy().astype(np.uint8), compression="gzip")
        # with h5py.File(file_path_roi, "w") as f:
        #     f.create_dataset("data", data=crop_hr.numpy().astype(np.uint8), compression="gzip")
        
        file_path_lr = os.path.join(save_dir_crop_lr, f"{base_filename_full}_{i:03d}.tif")
        file_path_hr = os.path.join(save_dir_crop_hr, f"{base_filename_roi}_{i:03d}.tif")
        
        imsave(file_path_lr, crop_lr)
        imsave(file_path_hr, crop_hr)