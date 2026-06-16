// frontend/src/hooks/useDocumentTitle.js
import { useEffect } from 'react';

function useDocumentTitle(title, baseTitle = 'RootNetwork') {
  useEffect(() => {
    if (title) {
      document.title = `${title} | ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }
    
    // Cleanup function (optional)
    return () => {
      document.title = baseTitle;
    };
  }, [title, baseTitle]);
}

export default useDocumentTitle;