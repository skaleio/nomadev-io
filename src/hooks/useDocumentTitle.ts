import { useEffect } from 'react';

/**
 * Hook personalizado para manejar el título del documento
 * @param title - El título que se mostrará en la pestaña del navegador
 */
export const useDocumentTitle = (title: string = 'NOMADEV.IO') => {
  useEffect(() => {
    document.title = title;
  }, [title]);
};
