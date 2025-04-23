export interface Order {
    orderId: string;
    channelOrderId: string;
    sku: string;
    shipFromWarehouse: string;
    quantity: number;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    phone: string;
    zipCode: string;
    country: string;
    company: string;
    channel: string;
}

export interface OrderItem {
    ID: number;
    OrderID: number;
    ProductID: string;
    Qty: number;
    ShipFromWarehouseName?: string;
}

export interface ShippingAddress {
    StreetLine1: string;
    StreetLine2?: string;
    City: string;
    StateCode: string;
    PhoneNumber: string;
    PostalCode: string;
    CountryName: string;
    CompanyName?: string;
}

export interface APIOrder {
    ID: number;
    OrderSourceOrderID: string;
    OrderSource: number;
    Items: OrderItem[];
    ShippingAddress: ShippingAddress;
}

export interface APIResponse {
    Items: APIOrder[];
    TotalResults: number;
}

export interface Column {
    key: keyof Order;
    header: string;
    width?: number;
}
