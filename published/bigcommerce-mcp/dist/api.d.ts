export declare class BigCommerceError extends Error {
}
export interface Product {
    id: number;
    name?: string;
    price?: number;
    sku?: string;
    availability?: string;
}
export declare function listProducts(keyword?: string, limit?: number): Promise<Product[]>;
export declare function getProduct(id: string): Promise<Product>;
export interface Order {
    id: number;
    status?: string;
    total?: string;
    date?: string;
    customer?: string;
}
export declare function listOrders(limit?: number): Promise<Order[]>;
export declare function formatProduct(p: Product, index?: number): string;
export declare function formatOrder(o: Order, index?: number): string;
export interface BrandsArgs {
    limit?: number;
    page?: number;
    name_like?: string;
}
/**
 * GET /v3/catalog/brands
 * data[].{id, name, page_title, meta_description, image_url,
 *          custom_url.{url, is_customized}}
 * meta.pagination.{total, count, per_page, current_page, total_pages}
 */
export declare function listBrands(args: BrandsArgs): Promise<string>;
export interface CategoriesArgs {
    limit?: number;
    page?: number;
    parent_id?: number;
}
/**
 * GET /v3/catalog/categories
 * data[].{id, parent_id, name, description, views, sort_order, is_active}
 */
export declare function listCategories(args: CategoriesArgs): Promise<string>;
export interface OrderArgs {
    id: string;
}
/**
 * GET /v2/orders/{order_id}
 * Order fields: id, customer_id, status_id, status, date_created, date_shipped,
 * subtotal_inc_tax, shipping_cost_inc_tax, discount_amount, total_inc_tax,
 * billing_address, shipping_addresses, products (line items).
 */
export declare function orderDetail(args: OrderArgs): Promise<string>;
