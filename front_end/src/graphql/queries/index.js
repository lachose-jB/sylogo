import { gql } from '@apollo/client';

export const ME_QUERY = gql`
  query Me {
    me { id phone firstName lastName role status }
  }
`;

export const PLATFORM_STATS = gql`
  query PlatformStats {
    platformStats { totalUsers totalOrders totalRevenue activeVendors pendingOrders }
  }
`;

export const ORDERS_OVER_TIME = gql`
  query OrdersOverTime($days: Int) {
    ordersOverTime(days: $days) { date count revenue }
  }
`;

export const TOP_VENDORS = gql`
  query TopVendors($limit: Int) {
    topVendors(limit: $limit) {
      vendor { id businessName address averageRating user { firstName lastName } }
      totalOrders totalRevenue
    }
  }
`;

export const LIST_USERS = gql`
  query ListUsers($filters: UserFilters) {
    users(filters: $filters) {
      id phone email firstName lastName role status createdAt
      vendorProfile { id businessName }
    }
  }
`;

export const LIST_ORDERS = gql`
  query ListOrders($filters: OrderFilters) {
    orders(filters: $filters) {
      id status total paymentMethod paymentStatus createdAt
      client { firstName lastName phone }
      vendor { businessName }
      delivery { deliveryManId deliveryMan { user { firstName lastName } } }
    }
  }
`;

export const GET_ORDER = gql`
  query GetOrder($id: ID!) {
    order(id: $id) {
      id status total subtotal deliveryFee paymentMethod paymentStatus notes estimatedTime createdAt
      deliveryAddress
      client { id firstName lastName phone }
      vendor { id businessName address }
      items { id quantity unitPrice subtotal product { name imageUrls } }
      delivery { id deliveryManId currentLat currentLng pickedUpAt deliveredAt proofImageUrl
        deliveryMan { user { firstName lastName phone } }
      }
      payment { id amount status transactionId createdAt }
    }
  }
`;

export const LIST_PRODUCTS = gql`
  query ListProducts($filters: ProductFilters) {
    products(filters: $filters) {
      id name price stock category status rejectionNote createdAt imageUrls
      vendor { businessName }
    }
  }
`;

export const PLATFORM_SETTINGS = gql`
  query PlatformSettings {
    platformSettings { id baseDeliveryFee pricePerKm defaultCommission maintenanceMode }
  }
`;

export const AUDIT_LOGS = gql`
  query AuditLogs($limit: Int, $offset: Int) {
    auditLogs(limit: $limit, offset: $offset) {
      id action entity entityId details ipAddress createdAt
      admin { firstName lastName }
    }
  }
`;

export const LIST_DELIVERY_USERS = gql`
  query ListDeliveryUsers($filters: UserFilters) {
    users(filters: $filters) {
      id phone firstName lastName status createdAt
      deliveryProfile {
        id vehicleType licenseNumber isAvailable averageRating totalDeliveries
      }
    }
  }
`;

export const RECENT_ORDERS = gql`
  query RecentOrders {
    orders(filters: { limit: 8 }) {
      id status total createdAt
      client { firstName lastName }
      vendor { businessName }
    }
  }
`;

export const ORDER_STATUS_CHANGED = gql`
  subscription OrderStatusChanged($orderId: ID!) {
    orderStatusChanged(orderId: $orderId) {
      id status updatedAt
    }
  }
`;
