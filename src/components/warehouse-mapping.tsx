import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useMutation, useQuery } from "@tanstack/react-query"
import axios from "axios"
import { Download, Upload } from "lucide-react"

export function WarehouseMapping() {
    const { toast } = useToast()

    const { data: csvContent, refetch } = useQuery({
        queryKey: ['warehouse-mapping'],
        queryFn: async () => {
            const response = await axios.get('/api/v1/orders/warehouse-mapping', {
                responseType: 'blob',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            })
            return response.data
        }
    })

    const uploadMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData()
            formData.append('file', file)

            await axios.post('/api/v1/orders/warehouse-mapping/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            })
        },
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Warehouse mapping updated successfully",
            })
            refetch()
        },
        onError: (error) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to upload warehouse mapping",
            })
        }
    })

    const handleDownload = () => {
        if (!csvContent) return

        const url = window.URL.createObjectURL(new Blob([csvContent]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', 'warehouse_mapping.csv')
        document.body.appendChild(link)
        link.click()
        link.remove()
    }

    const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            uploadMutation.mutate(file)
        }
    }

    return (
        <div className="flex gap-4">
            <Button
                variant="outline"
                onClick={handleDownload}
                disabled={!csvContent}
            >
                <Download className="mr-2 h-4 w-4" />
                Download Mappings
            </Button>

            <div className="relative">
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleUpload}
                    className="hidden"
                    id="warehouse-mapping-upload"
                />
                <Button
                    variant="outline"
                    onClick={() => document.getElementById('warehouse-mapping-upload')?.click()}
                    disabled={uploadMutation.isPending}
                >
                    <Upload className="mr-2 h-4 w-4" />
                    {uploadMutation.isPending ? 'Uploading...' : 'Upload Mappings'}
                </Button>
            </div>
        </div>
    )
}
