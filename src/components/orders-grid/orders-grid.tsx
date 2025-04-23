import { Column, Order } from './types';

interface OrdersGridProps {
    orders: Order[];
    isLoading?: boolean;
}

export function OrdersGrid({ orders, isLoading = false }: OrdersGridProps) {
    const columns: Column[] = [
        { key: 'orderId', header: 'Order ID', width: 150 },
        { key: 'channelOrderId', header: 'Channel Order ID', width: 150 },
        { key: 'sku', header: 'SKU', width: 120 },
        { key: 'shipFromWarehouse', header: 'Ship From Warehouse', width: 180 },
        { key: 'quantity', header: 'Qty', width: 80 },
        { key: 'addressLine1', header: 'Address Line 1', width: 200 },
        { key: 'addressLine2', header: 'Address Line 2', width: 200 },
        { key: 'city', header: 'City', width: 120 },
        { key: 'state', header: 'State', width: 100 },
        { key: 'phone', header: 'Phone #', width: 120 },
        { key: 'zipCode', header: 'Zip Code', width: 100 },
        { key: 'country', header: 'Country', width: 100 },
        { key: 'company', header: 'Company', width: 150 },
        { key: 'channel', header: 'Channel', width: 120 }
    ];

    if (isLoading) {
        return (
            <div className="w-full h-96 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="w-full overflow-x-auto shadow-md rounded-lg">
            <table className="w-full text-sm text-left text-gray-700">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                className="px-6 py-3 font-medium tracking-wider"
                                style={{ width: column.width }}
                            >
                                {column.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {orders.map((order, index) => (
                        <tr
                            key={order.orderId}
                            className={`bg-white border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                }`}
                        >
                            {columns.map((column) => (
                                <td key={`${order.orderId}-${column.key}`} className="px-6 py-4 whitespace-nowrap">
                                    {order[column.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            {orders.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    No orders found
                </div>
            )}
        </div>
    );
}
