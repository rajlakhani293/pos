import { useEffect, useRef } from 'react';

export const useScrollToError = (
  errors: any,
  isSubmitting: boolean,
) => {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!isSubmitting && Object.keys(errors).length > 0) {
      setTimeout(() => {
        scrollToFirstError();
      }, 100);
    }
  }, [isSubmitting, errors]);

  const scrollToFirstError = () => {
    if (!formRef.current) return;

    // Find first field with error based on your form structure
    const firstErrorField = Object.keys(errors).find(key => errors[key]);
    
    if (firstErrorField) {
      const errorElement = formRef.current.querySelector(
        `[data-field="${firstErrorField}"]`
      );

      if (errorElement) {
        errorElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center'
        });

        setTimeout(() => {
          // Try to find focusable elements in order of preference
          const focusableSelectors = [
            'input:not([disabled])',
            'textarea:not([disabled])', 
            'button:not([disabled])',
            '[role="combobox"]', // shadcn Select trigger
            '[tabindex]:not([tabindex="-1"])'
          ];
          
          let focusableElement: HTMLElement | null = null;
          
          for (const selector of focusableSelectors) {
            const element = errorElement.querySelector(selector) as HTMLElement;
            if (element && element.offsetParent !== null) {
              focusableElement = element;
              break;
            }
          }
          
          if (focusableElement) {
            focusableElement.focus();
            
            // For Select components, try to open them
            if (focusableElement.getAttribute('role') === 'combobox') {
              focusableElement.click();
            }
          }
        }, 300); 
      }
    }
  };

  return { formRef, scrollToFirstError };
};
