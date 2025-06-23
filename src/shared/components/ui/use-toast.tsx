export function useToast() {
  return {
    toast: ({ title, description, variant }: { title: string; description?: string; variant?: string }) => {
      // For now, just log to the console
      console.log(`[${variant || 'info'}] ${title}: ${description || ''}`);
    }
  };
} 