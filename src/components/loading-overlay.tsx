
interface LoadingOverlayProps {
    isVisible: boolean;
}

export function LoadingOverlay({ isVisible }: LoadingOverlayProps) {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-8 flex flex-col items-center space-y-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-700 font-medium">Loading...</p>
            </div>
        </div>
    );
}
