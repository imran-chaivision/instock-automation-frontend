import { Download } from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'

interface StatsCardProps {
    title: string
    orders: number
    units: number
    skus: number
    onDownload: () => void
    savedViewId?: string
}

export function StatsCard({ title, orders, units, skus, onDownload, savedViewId }: StatsCardProps) {
    return (
        <Card className="p-6 bg-white hover:bg-slate-50/50 transition-colors">
            <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-xl font-semibold text-slate-800">{title}</h3>
                        <div className="mt-4 space-y-2 text-sm">
                            <p className="flex items-center justify-between">
                                <span className="text-slate-500">Orders</span>
                                <span className="font-medium text-slate-800">{orders}</span>
                            </p>
                            <p className="flex items-center justify-between">
                                <span className="text-slate-500">Units</span>
                                <span className="font-medium text-slate-800">{units}</span>
                            </p>
                            <p className="flex items-center justify-between">
                                <span className="text-slate-500">SKUs</span>
                                <span className="font-medium text-slate-800">{skus}</span>
                            </p>
                        </div>
                    </div>
                    <Button
                        size="icon"
                        variant="outline"
                        onClick={onDownload}
                        disabled={!savedViewId}
                        className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm hover:border-slate-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </Card>
    )
}
