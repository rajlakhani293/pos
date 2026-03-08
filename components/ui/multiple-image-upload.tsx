"use client"

import { useState, useRef, useEffect } from "react";
import { Button } from "./button";
import { PlusIcon, EditIcon, DeleteIcon, ImageIcon, MutipleImageIcon, EyeIcon, BadgeCheckIcon } from "../AppIcon";
import CustomPopup from "./custom-popup";
import { DialogClose } from "./dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "./carousel";

interface ImageFile {
  id: string;
  file?: File;
  preview: string;
  isPrimary?: boolean;
}

interface PreviewModalState {
  isOpen: boolean;
  images: ImageFile[];
  currentIndex: number;
  type: 'front' | 'rear' | 'other';
}

interface MultipleImageUploadProps {
  initialImages?: any[];
  onFrontImagesChange: (files: File[]) => void;
  onRearImagesChange: (files: File[]) => void;
  onOtherImagesChange: (files: File[]) => void;
  onImagesUpdate?: (data: { item_images: any[], files: Record<string, File> }) => void;
  frontError?: string;
  rearError?: string;
  otherError?: string;
  className?: string;
  accept?: string;
}

export function MultipleImageUpload({
  initialImages = [],
  onFrontImagesChange,
  onRearImagesChange,
  onOtherImagesChange,
  onImagesUpdate,
  frontError,
  rearError,
  otherError,
  className = "",
  accept = "image/*"
}: MultipleImageUploadProps) {
  const hasInitialized = useRef(false);
  const [frontImagesState, setFrontImagesState] = useState<ImageFile[]>([]);
  const [rearImagesState, setRearImagesState] = useState<ImageFile[]>([]);
  const [otherImagesState, setOtherImagesState] = useState<ImageFile[]>([]);
  const maxSize = 5;
  const maxOtherImages = 15;

  const [selectedOtherImageIndex, setSelectedOtherImageIndex] = useState(0);
  const [previewModal, setPreviewModal] = useState<PreviewModalState>({
    isOpen: false,
    images: [],
    currentIndex: 0,
    type: 'other'
  });

  const [isDraggingFront, setIsDraggingFront] = useState(false);
  const [isDraggingRear, setIsDraggingRear] = useState(false);
  const [isDraggingOther, setIsDraggingOther] = useState(false);
  const [mainApi, setMainApi] = useState<CarouselApi>();
  const [previewApi, setPreviewApi] = useState<CarouselApi>();

  const frontInputRef = useRef<HTMLInputElement>(null);
  const rearInputRef = useRef<HTMLInputElement>(null);
  const otherInputRef = useRef<HTMLInputElement>(null);

  const checkHasPrimary = () => {
    return frontImagesState.some(img => img.isPrimary) || 
           rearImagesState.some(img => img.isPrimary) || 
           otherImagesState.some(img => img.isPrimary);
  };

  const syncImageData = () => {
    if (!onImagesUpdate) return;

    const allImageData: any[] = [];
    const fileMapping: Record<string, File> = {};
    let currentKeyIndex = 1;

    // Process Front Images
    frontImagesState.forEach((img) => {
      const key = `item_img${currentKeyIndex}`;
      allImageData.push({
        sort_order: 0,
        is_primary: !!img.isPrimary,
        key: key,
        url: img.file ? undefined : img.preview
      });
      if (img.file) fileMapping[key] = img.file;
      currentKeyIndex++;
    });

    // Process Rear Images
    rearImagesState.forEach((img) => {
      const key = `item_img${currentKeyIndex}`;
      allImageData.push({
        sort_order: 1,
        is_primary: !!img.isPrimary,
        key: key,
        url: img.file ? undefined : img.preview
      });
      if (img.file) fileMapping[key] = img.file;
      currentKeyIndex++;
    });

    // Process Other Images
    otherImagesState.forEach((img, index) => {
      const key = `item_img${currentKeyIndex}`;
      allImageData.push({
        sort_order: index + 2, // Start from 2 after front and rear
        is_primary: !!img.isPrimary,
        key: key,
        url: img.file ? undefined : img.preview
      });
      if (img.file) fileMapping[key] = img.file;
      currentKeyIndex++;
    });

    onImagesUpdate({
      item_images: allImageData,
      files: fileMapping
    });
  };

  useEffect(() => {
    syncImageData();
  }, [frontImagesState, rearImagesState, otherImagesState]);

  useEffect(() => {
    if (hasInitialized.current) return;
    
    if (initialImages && initialImages.length > 0) {
      const front: ImageFile[] = [];
      const rear: ImageFile[] = [];
      const other: ImageFile[] = [];

      initialImages.forEach((img: any) => {
        const imageFile: ImageFile = {
          id: Math.random().toString(36).substr(2, 9),
          preview: img.url,
          isPrimary: img.is_primary
        };

        if (img.sort_order === 0) {
          front.push(imageFile);
        } else if (img.sort_order === 1) {
          rear.push(imageFile);
        } else {
          other.push(imageFile);
        }
      });

      setFrontImagesState(front);
      setRearImagesState(rear);
      setOtherImagesState(other);
    }
    
    hasInitialized.current = true;
  }, [initialImages]);

  // Front Image Handlers
  const handleDragOverFront = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFront(true);
  };

  const handleDragLeaveFront = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFront(false);
  };

  const handleDropFront = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFront(false);

    const files = Array.from(e.dataTransfer.files);
    handleFrontFiles(files);
  };

  const handleFrontFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFrontFiles(files);
  };

  const handleFrontFiles = (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length > 1) {
      alert('You can only upload one front image');
      return;
    }

    const validFiles = imageFiles.filter(file => {
      if (file.size > maxSize * 1024 * 1024) {
        alert(`File "${file.name}" is too large. Max size is ${maxSize}MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      const hasPrimary = checkHasPrimary();
      const newImages: ImageFile[] = validFiles.map((file, idx) => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file),
        isPrimary: !hasPrimary && idx === 0
      }));

      setFrontImagesState(newImages);
      onFrontImagesChange(newImages.map(img => img.file).filter((f): f is File => !!f));
      
      // Update preview modal if it's open for front image
      if (previewModal.isOpen && previewModal.type === 'front') {
        setPreviewModal(prev => ({
          ...prev,
          images: newImages,
          currentIndex: 0
        }));
      }
    }
  };

  useEffect(() => {
    if (!mainApi) return;
    if (mainApi.selectedScrollSnap() !== selectedOtherImageIndex) {
      mainApi.scrollTo(selectedOtherImageIndex);
    }
  }, [mainApi, selectedOtherImageIndex]);

  useEffect(() => {
    if (!mainApi) return;
    const onSelect = () => {
      setSelectedOtherImageIndex(mainApi.selectedScrollSnap());
    };
    mainApi.on("select", onSelect);
    return () => {
      mainApi.off("select", onSelect);
    };
  }, [mainApi]);

  useEffect(() => {
    if (!previewApi) return;
    if (previewApi.selectedScrollSnap() !== previewModal.currentIndex) {
      previewApi.scrollTo(previewModal.currentIndex);
    }
  }, [previewApi, previewModal.currentIndex]);

  useEffect(() => {
    if (!previewApi) return;
    previewApi.on("select", () => {
      setPreviewModal(prev => ({
        ...prev,
        currentIndex: previewApi.selectedScrollSnap()
      }));
    });
  }, [previewApi]);

  const handleClickFront = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    frontInputRef.current?.click();
  };

  const handleRemoveFrontImage = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setFrontImagesState([]);
    onFrontImagesChange([]);
    if (frontInputRef.current) {
      frontInputRef.current.value = '';
    }
  };

  // Rear Image Handlers
  const handleDragOverRear = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingRear(true);
  };

  const handleDragLeaveRear = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingRear(false);
  };

  const handleDropRear = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingRear(false);

    const files = Array.from(e.dataTransfer.files);
    handleRearFiles(files);
  };

  const handleRearFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleRearFiles(files);
  };

  const handleRearFiles = (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length > 1) {
      alert('You can only upload one rear image');
      return;
    }

    const validFiles = imageFiles.filter(file => {
      if (file.size > maxSize * 1024 * 1024) {
        alert(`File "${file.name}" is too large. Max size is ${maxSize}MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      const hasPrimary = checkHasPrimary();
      const newImages: ImageFile[] = validFiles.map((file, idx) => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file),
        isPrimary: !hasPrimary && idx === 0
      }));

      setRearImagesState(newImages);
      onRearImagesChange(newImages.map(img => img.file).filter((f): f is File => !!f));

      // Update preview modal if it's open for rear image
      if (previewModal.isOpen && previewModal.type === 'rear') {
        setPreviewModal(prev => ({
          ...prev,
          images: newImages,
          currentIndex: 0
        }));
      }
    }
  };

  const handleClickRear = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    rearInputRef.current?.click();
  };

  const handleRemoveRearImage = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setRearImagesState([]);
    onRearImagesChange([]);
    if (rearInputRef.current) {
      rearInputRef.current.value = '';
    }
  };

  // Other Images Handlers
  const handleDragOverOther = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOther(true);
  };

  const handleDragLeaveOther = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOther(false);
  };

  const handleDropOther = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOther(false);

    const files = Array.from(e.dataTransfer.files);
    handleOtherFiles(files);
  };

  const handleOtherFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleOtherFiles(files);
  };

  const handleOtherFiles = (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    // Smart distribution: Fill empty boxes in order (Front -> Rear -> Other)
    const availableSlots = [];

    // Check Front slot
    if (frontImagesState.length === 0 && imageFiles.length > 0) {
      availableSlots.push({ type: 'front', file: imageFiles[0] });
      imageFiles.splice(0, 1);
    }

    // Check Rear slot
    if (rearImagesState.length === 0 && imageFiles.length > 0) {
      availableSlots.push({ type: 'rear', file: imageFiles[0] });
      imageFiles.splice(0, 1);
    }

    // Remaining files go to Other Images
    if (imageFiles.length > 0) {
      if (otherImagesState.length + imageFiles.length > maxOtherImages) {
        alert(`You can only upload up to ${maxOtherImages} other images`);
        return;
      }

      const validFiles = imageFiles.filter(file => {
        if (file.size > maxSize * 1024 * 1024) {
          alert(`File "${file.name}" is too large. Max size is ${maxSize}MB`);
          return false;
        }
        return true;
      });

      const hasPrimary = checkHasPrimary() || 
        availableSlots.some(s => s.type === 'front' || s.type === 'rear');

      const newImages: ImageFile[] = validFiles.map((file, idx) => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file),
        isPrimary: !hasPrimary && idx === 0
      }));

      const updatedImages = [...otherImagesState, ...newImages];
      setOtherImagesState(updatedImages);
      onOtherImagesChange(updatedImages.map(img => img.file).filter((f): f is File => !!f));
    }

    // Process Front and Rear assignments
    availableSlots.forEach((slot, idx) => {
      if (slot.file.size > maxSize * 1024 * 1024) {
        alert(`File "${slot.file.name}" is too large. Max size is ${maxSize}MB`);
        return;
      }

      const hasPrimaryAcross = checkHasPrimary();

      const newImage: ImageFile = {
        id: Math.random().toString(36).substr(2, 9),
        file: slot.file,
        preview: URL.createObjectURL(slot.file),
        isPrimary: !hasPrimaryAcross && idx === 0
      };

      if (slot.type === 'front') {
        setFrontImagesState([newImage]);
        if (newImage.file) onFrontImagesChange([newImage.file]);
      } else if (slot.type === 'rear') {
        setRearImagesState([newImage]);
        if (newImage.file) onRearImagesChange([newImage.file]);
      }
    });
  };

  const handleClickOther = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    otherInputRef.current?.click();
  };

  const handleRemoveOtherImage = (id: string, index: number, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const updatedImages = otherImagesState.filter(img => img.id !== id);
    setOtherImagesState(updatedImages);
    onOtherImagesChange(updatedImages.map(img => img.file).filter((f): f is File => !!f));

    if (index <= selectedOtherImageIndex) {
      setSelectedOtherImageIndex(Math.max(0, selectedOtherImageIndex - 1));
    }
  };

  const openPreviewModal = (images: ImageFile[], currentIndex: number, type: 'front' | 'rear' | 'other') => {
    setPreviewModal({
      isOpen: true,
      images,
      currentIndex,
      type
    });
  };

  const closePreviewModal = () => {
    setPreviewModal({
      isOpen: false,
      images: [],
      currentIndex: 0,
      type: 'other'
    });
  };

  const handleModalImageDelete = () => {
    const { images, currentIndex, type } = previewModal;
    const imageToDelete = images[currentIndex];
    
    if (type === 'front') {
      handleRemoveFrontImage();
    } else if (type === 'rear') {
      handleRemoveRearImage();
    } else if (type === 'other') {
      handleRemoveOtherImage(imageToDelete.id, currentIndex);
    }
    
    if (images.length === 1) {
      closePreviewModal();
    } else {
      const newImages = images.filter((_, index) => index !== currentIndex);
      const newIndex = Math.min(currentIndex, newImages.length - 1);
      setPreviewModal(prev => ({
        ...prev,
        images: newImages,
        currentIndex: Math.max(0, newIndex)
      }));
    }
  };

  const handleSetAsPrimary = (type?: 'front' | 'rear' | 'other', id?: string) => {
    const targetType = type || previewModal.type;
    const targetId = id || (previewModal.images[previewModal.currentIndex]?.id);

    const newFront = frontImagesState.map(img => ({ ...img, isPrimary: targetType === 'front' }));
    const newRear = rearImagesState.map(img => ({ ...img, isPrimary: targetType === 'rear' }));
    
    let newOther = otherImagesState.map(img => ({ 
      ...img, 
      isPrimary: targetType === 'other' && img.id === targetId 
    }));

    // If it's an "other" image being set as primary, move it to the front
    if (targetType === 'other' && targetId) {
      const primaryImgIndex = newOther.findIndex(img => img.id === targetId);
      if (primaryImgIndex !== -1) {
        const [primaryImg] = newOther.splice(primaryImgIndex, 1);
        newOther = [primaryImg, ...newOther];
        setSelectedOtherImageIndex(0);
      }
    }

    setFrontImagesState(newFront);
    setRearImagesState(newRear);
    setOtherImagesState(newOther);
    
    // Trigger callbacks to sync with parent
    onFrontImagesChange(newFront.map(img => img.file).filter((f): f is File => !!f));
    onRearImagesChange(newRear.map(img => img.file).filter((f): f is File => !!f));
    onOtherImagesChange(newOther.map(img => img.file).filter((f): f is File => !!f));
    
    if (previewModal.isOpen) {
      setPreviewModal(prev => {
        let newModalImages = [...prev.images];
        if (prev.type === 'other' && targetType === 'other') {
          newModalImages = newOther;
        } else {
          newModalImages = newModalImages.map(img => ({
            ...img,
            isPrimary: (prev.type === 'front' && targetType === 'front') || 
                       (prev.type === 'rear' && targetType === 'rear') ||
                       (prev.type === 'other' && targetType === 'other' && img.id === targetId)
          }));
        }

        return { 
          ...prev, 
          images: newModalImages,
          currentIndex: (prev.type === targetType) ? 0 : prev.currentIndex
        };
      });
    }
  };

  return (
    <div className={`${className}`}>
       {/* <h3 className="text-base font-semibold text-gray-900">Item Images</h3> */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 h-[250px]">
        {/* First Column: Front and Rear stacked */}
        <div className="h-full">
          {/* Front View Box */}
          <div className="h-1/2 p-1">
            {frontImagesState.length === 0 ? (
              <div
                className={`w-full h-full border-2 border-dashed rounded-xl text-center transition-all cursor-pointer bg-white flex flex-col items-center justify-center ${isDraggingFront
                    ? 'border-blue-500 bg-blue-50 ring-4 ring-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                  }`}
                onDragOver={handleDragOverFront}
                onDragLeave={handleDragLeaveFront}
                onDrop={handleDropFront}
                onClick={handleClickFront}
              >
                <div className="flex flex-col items-center space-y-2 py-2 hover:scale-110 transition-transform">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-200">
                    <ImageIcon/>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-900">Upload Image</p>
                  </div>
                </div>
              </div>
            ) : (
              <div 
                className="relative group h-[calc(125px-8px)] overflow-hidden cursor-pointer"
                onClick={() => openPreviewModal(frontImagesState, 0, 'front')}
              >
                <img
                  src={frontImagesState[0].preview}
                  alt="Front view preview"
                  className="h-full w-full object-contain rounded-lg border border-gray-200 bg-gray-50"
                />
                {frontImagesState[0].isPrimary && (
                  <div className="absolute top-0 right-0 bg-blue-600 text-white p-1 rounded-tr-lg rounded-bl-lg shadow-sm">
                    <BadgeCheckIcon className="size-3" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                  <Button
                    type="button"
                    variant={frontImagesState[0].isPrimary ? "default" : "secondary"}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetAsPrimary('front');
                    }}
                    className={`size-6 p-0 rounded-sm ${frontImagesState[0].isPrimary ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                  >
                    <BadgeCheckIcon className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      openPreviewModal(frontImagesState, 0, 'front');
                    }}
                    className="size-6 p-0 rounded-sm"
                  >
                    <EyeIcon className="size-4" />
                  </Button>
                  {!frontImagesState[0].isPrimary && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFrontImage(e);
                      }}
                      className="size-6 p-0 rounded-sm"
                    >
                      <DeleteIcon className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}
            {frontError && (
              <p className="text-xs text-red-500 mt-1">{frontError}</p>
            )}
            <input
              ref={frontInputRef}
              type="file"
              accept={accept}
              onChange={handleFrontFileSelect}
              className="hidden"
            />
          </div>

          {/* Rear View Box */}
          <div className="h-1/2 p-1">
            {rearImagesState.length === 0 ? (
              <div
                className={`w-full h-full border-2 border-dashed rounded-xl text-center transition-all cursor-pointer bg-white flex flex-col items-center justify-center ${isDraggingRear
                    ? 'border-blue-500 bg-blue-50 ring-4 ring-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                  }`}
                onDragOver={handleDragOverRear}
                onDragLeave={handleDragLeaveRear}
                onDrop={handleDropRear}
                onClick={handleClickRear}
              >
                <div className="flex flex-col items-center space-y-2 py-2 hover:scale-110 transition-transform">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-200">
                    <ImageIcon/>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-900">Upload Image</p>
                  </div>
                </div>
              </div>
            ) : (
              <div 
                className="relative group h-[calc(125px-8px)] overflow-hidden cursor-pointer"
                onClick={() => openPreviewModal(rearImagesState, 0, 'rear')}
              >
                <img
                  src={rearImagesState[0].preview}
                  alt="Rear view preview"
                  className="w-full h-full object-contain rounded-lg border border-gray-200 bg-gray-50"
                />
                {rearImagesState[0].isPrimary && (
                  <div className="absolute top-0 right-0 bg-blue-600 text-white p-1 rounded-tr-lg rounded-bl-lg shadow-sm">
                    <BadgeCheckIcon className="size-3" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                  <Button
                    type="button"
                    variant={rearImagesState[0].isPrimary ? "default" : "secondary"}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetAsPrimary('rear');
                    }}
                    className={`size-6 p-0 rounded-sm ${rearImagesState[0].isPrimary ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                  >
                    <BadgeCheckIcon className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      openPreviewModal(rearImagesState, 0, 'rear');
                    }}
                    className="size-6 p-0 rounded-sm"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </Button>
                  {!rearImagesState[0].isPrimary && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveRearImage(e);
                      }}
                      className="size-6 p-0 rounded-sm"
                    >
                      <DeleteIcon className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}
            {rearError && (
              <p className="text-xs text-red-500 mt-1">{rearError}</p>
            )}
            <input
              ref={rearInputRef}
              type="file"
              accept={accept}
              onChange={handleRearFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {/* Second Column: Other Images */}
        <div className="">
          {otherImagesState.length === 0 ? (
            <div
              className={`w-full h-full border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer bg-white ${isDraggingOther
                  ? 'border-blue-500 bg-blue-50 ring-4 ring-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
                }`}
              onDragOver={handleDragOverOther}
              onDragLeave={handleDragLeaveOther}
              onDrop={handleDropOther}
              onClick={handleClickOther}
            >
              <div className="h-full flex flex-col items-center justify-center gap-2 hover:scale-110 transition-transform">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-200">
                  <MutipleImageIcon className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-sm font-semibold text-gray-900">Drag & Drop Images</p>
                <p className="text-xs text-gray-500 max-w-xs mx-auto text-center">
                  You can add up to {maxOtherImages} images.
                </p>
              </div>
            </div>
          ) : (
            <div className="border-2 border-gray-200 rounded-xl h-full max-h-[250px] flex flex-col items-center overflow-hidden">
              {/* Main Preview Slider */}
              <div 
                className="border-b-2 border-gray-200 relative group w-full flex-8 p-2 flex items-center justify-center min-h-0"
              >
                <Carousel 
                  setApi={setMainApi} 
                  opts={{ loop: false }} 
                  className="w-full h-full"
                >
                  <CarouselContent className="h-full ml-0" wrapperClassName="h-full">
                    {otherImagesState.map((image, index) => (
                      <CarouselItem 
                        key={image.id} 
                        className="h-full pl-0 flex items-center justify-center cursor-pointer"
                        onClick={() => openPreviewModal(otherImagesState, index, 'other')}
                      >
                        <img
                          src={image.preview}
                          alt="Other images preview"
                          className="max-w-full max-h-full object-contain pointer-events-none"
                        />
                        {image.isPrimary && (
                          <div className="absolute top-0 right-0 bg-blue-600 text-white p-1.5 rounded-tr-lg rounded-bl-lg shadow-sm z-10">
                            <BadgeCheckIcon className="size-4" />
                          </div>
                        )}
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  
                  {otherImagesState.length > 1 && (
                    <>
                      <CarouselPrevious 
                        className="left-2 bg-white/80 border-gray-200 hover:bg-white transition-opacity opacity-0 group-hover:opacity-100 z-10 disabled:hidden" 
                      />
                      <CarouselNext 
                        className="right-2 bg-white/80 border-gray-200 hover:bg-white transition-opacity opacity-0 group-hover:opacity-100 z-10 disabled:hidden" 
                      />
                    </>
                  )}
                </Carousel>
              </div>

              {/* 4-Box Gallery */}
              <div className="grid grid-cols-4 gap-1 border-gray-200 flex-2 items-center justify-center p-1">
                {otherImagesState.slice(0, 3).map((image, index) => {
                  const hasMore = index === 2 && otherImagesState.length > 3;
                  const remainingCount = otherImagesState.length - 3;

                  return (
                    <div
                      key={image.id}
                      onClick={() => setSelectedOtherImageIndex(index)}
                      className={`relative h-10 w-10 rounded-lg border transition-all cursor-pointer ${selectedOtherImageIndex === index
                        ? "ring-1 ring-blue-500"
                        : 'ring-1 ring-gray-200'
                        }`}
                    >
                      <img
                        src={image.preview}
                        alt={`Additional image ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />

                      {hasMore && (
                        <div className="absolute rounded-lg inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
                          <span className="text-white font-bold text-lg">+{remainingCount}</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {otherImagesState.length < maxOtherImages && (
                  <div
                    onClick={handleClickOther}
                    className="w-10 h-10 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 hover:bg-gray-100 transition-all"
                  >
                    <PlusIcon className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>
            </div>
          )}

          <input
            ref={otherInputRef}
            type="file"
            accept={accept}
            multiple
            onChange={handleOtherFileSelect}
            className="hidden"
          />

          {otherError && (
            <p className="text-xs text-red-500 mt-1">{otherError}</p>
          )}
        </div>
      </div>

      <CustomPopup
        open={previewModal.isOpen}
        onOpenChange={(open) => !open && closePreviewModal()}
        title={
          previewModal.type === 'front' ? 'Front Image' :
          previewModal.type === 'rear' ? 'Rear Image' : 'Other Images'
        }
        className="sm:max-w-[600px]"
        footer={
          <div className="flex w-full justify-between items-center">
            {!previewModal.images[previewModal.currentIndex]?.isPrimary && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleModalImageDelete}
                className="gap-2"
              >
                <DeleteIcon className="w-4 h-4" />
                Delete
              </Button>
            )}
            <div className="flex gap-2">
              {(previewModal.type === 'front' || previewModal.type === 'rear') && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    if (previewModal.type === 'front') {
                      handleClickFront();
                    } else if (previewModal.type === 'rear') {
                      handleClickRear();
                    }
                  }}
                  className="gap-2"
                >
                  <EditIcon className="w-4 h-4" />
                  Change
                </Button>
              )}
              {previewModal.type === 'other' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSetAsPrimary()}
                  disabled={previewModal.images[previewModal.currentIndex]?.isPrimary}
                >
                  {previewModal.images[previewModal.currentIndex]?.isPrimary ? 'Primary' : 'Set as Primary'}
                </Button>
              )}
              <DialogClose asChild>
                <Button type="button" variant="outline">Close</Button>
              </DialogClose>
            </div>
          </div>
        }
      >
        <div className="relative h-[400px] w-full flex items-center justify-center overflow-hidden bg-gray-50 rounded-lg group">
          <Carousel 
            setApi={setPreviewApi} 
            opts={{ loop: false, startIndex: previewModal.currentIndex }} 
            className="w-full h-full"
          >
            <CarouselContent className="h-full ml-0" wrapperClassName="h-full">
              {previewModal.images.map((image) => (
                <CarouselItem key={image.id} className="h-full pl-0 flex items-center justify-center p-4">
                  <img
                    src={image.preview}
                    alt="Preview"
                    className="max-w-full max-h-full object-contain shadow-sm rounded-md"
                  />
                </CarouselItem>
              ))}
            </CarouselContent>

            {previewModal.images.length > 1 && (
              <>
                <CarouselPrevious className="left-4 size-10 bg-white/90 border-gray-200 hover:bg-white shadow-md transition-opacity opacity-0 group-hover:opacity-100 disabled:hidden" />
                <CarouselNext className="right-4 size-10 bg-white/90 border-gray-200 hover:bg-white shadow-md transition-opacity opacity-0 group-hover:opacity-100 disabled:hidden" />
              </>
            )}
          </Carousel>
        </div>
      </CustomPopup>
    </div>
  );
}
