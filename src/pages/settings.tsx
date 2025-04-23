import { WarehouseMapping } from "@/components/warehouse-mapping"

export function Settings() {
    return (
        <div className="container mx-auto py-10">
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                    <p className="text-muted-foreground">
                        Manage your account settings and preferences.
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <h3 className="text-lg font-medium">Warehouse Mapping</h3>
                        <p className="text-sm text-muted-foreground">
                            Download or upload warehouse mapping configurations.
                        </p>
                        <WarehouseMapping />
                    </div>

                    {/* ... existing settings content ... */}
                </div>
            </div>
        </div>
    )
}
