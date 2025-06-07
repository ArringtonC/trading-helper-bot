export function useToast() {
    return {
        toast: function (_a) {
            var title = _a.title, description = _a.description, variant = _a.variant;
            // For now, just log to the console
            console.log("[".concat(variant || 'info', "] ").concat(title, ": ").concat(description || ''));
        }
    };
}
