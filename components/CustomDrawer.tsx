"use client";

import { ReactNode } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { X } from "lucide-react";

interface CustomDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  footer?: boolean;
  children: ReactNode;
  onSave?: () => void | Promise<void>;
  saveButtonText?: string;
  cancelButtonText?: string;
  isSaving?: boolean;
  disabled?: boolean;
  width?: string | number;
}

const CustomDrawer = ({
  isOpen,
  onClose,
  title,
  subtitle,
  footer = true,
  children,
  onSave,
  saveButtonText = "Save",
  cancelButtonText = "Cancel",
  isSaving = false,
  disabled = false,
  width,
}: CustomDrawerProps) => {
  const getWidthClass = (width: string | number | undefined): string => {
    if (!width) return 'w-[700px]'; 
    if (typeof width === 'string') return width;
    return `w-[${width}px]`;
  };

  const handleSave = async () => {
    if (onSave && !disabled && !isSaving) {
      await onSave();
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()} direction="right">
      <DrawerContent className={getWidthClass(width)}>
        <DrawerHeader className="border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {title && <DrawerTitle className="text-xl">{title}</DrawerTitle>}
              {subtitle && <DrawerDescription>{subtitle}</DrawerDescription>}
            </div>
              <DrawerClose asChild className="h-full">
                <Button variant="ghost" size="sm">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>

        {footer && (
          <div className="border-t p-4 shrink-0 flex justify-end">
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={onClose} 
                disabled={isSaving}
              >
                {cancelButtonText}
              </Button>
              {onSave && (
                <Button 
                  onClick={handleSave} 
                  disabled={disabled || isSaving}
                  className="min-w-[120px]"
                >
                  {isSaving ? (
                    <span className="flex items-center gap-2">
                      <Spinner />
                      Saving...
                    </span>
                  ) : (
                    saveButtonText
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
};

export default CustomDrawer;
