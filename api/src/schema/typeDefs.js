export const typeDefs = `#graphql

  scalar DateTime
  scalar JSON

  enum UserRole { CLIENT VENDOR DELIVERY ADMIN }
  enum UserStatus { PENDING ACTIVE SUSPENDED REJECTED }
  enum OrderStatus { PENDING CONFIRMED PREPARING READY PICKED_UP IN_TRANSIT DELIVERED CANCELLED REFUNDED }
  enum PaymentStatus { PENDING PAID FAILED REFUNDED }
  enum PaymentMethod { ORANGE_MONEY CASH }
  enum ProductStatus { PENDING_REVIEW APPROVED REJECTED }

  # --- User & Auth ---

  type User {
    id: ID!
    phone: String!
    email: String
    firstName: String!
    lastName: String!
    role: UserRole!
    status: UserStatus!
    createdAt: DateTime!
    vendorProfile: VendorProfile
    deliveryProfile: DeliveryProfile
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  # --- Vendor ---

  type VendorProfile {
    id: ID!
    userId: ID!
    businessName: String!
    businessType: String!
    address: String!
    latitude: Float!
    longitude: Float!
    coverageRadius: Float!
    commissionRate: Float!
    isOpen: Boolean!
    openingHours: JSON
    averageRating: Float!
    totalReviews: Int!
    createdAt: DateTime!
    user: User!
    products: [Product!]!
  }

  # --- Delivery Man ---

  type DeliveryProfile {
    id: ID!
    userId: ID!
    vehicleType: String!
    licenseNumber: String!
    currentLat: Float
    currentLng: Float
    isAvailable: Boolean!
    averageRating: Float!
    totalDeliveries: Int!
    user: User!
  }

  # --- Product ---

  type Product {
    id: ID!
    vendorId: ID!
    name: String!
    description: String
    price: Float!
    stock: Int!
    imageUrls: [String!]!
    category: String!
    status: ProductStatus!
    rejectionNote: String
    createdAt: DateTime!
    vendor: VendorProfile!
  }

  # --- Order ---

  type OrderItem {
    id: ID!
    productId: ID!
    quantity: Int!
    unitPrice: Float!
    subtotal: Float!
    product: Product!
  }

  type Order {
    id: ID!
    clientId: ID!
    vendorId: ID!
    status: OrderStatus!
    deliveryAddress: String!
    deliveryFee: Float!
    subtotal: Float!
    total: Float!
    paymentMethod: PaymentMethod!
    paymentStatus: PaymentStatus!
    notes: String
    estimatedTime: Int
    createdAt: DateTime!
    updatedAt: DateTime!
    client: User!
    vendor: VendorProfile!
    items: [OrderItem!]!
    delivery: Delivery
    payment: Payment
  }

  # --- Delivery ---

  type Delivery {
    id: ID!
    orderId: ID!
    deliveryManId: ID
    currentLat: Float
    currentLng: Float
    pickedUpAt: DateTime
    deliveredAt: DateTime
    proofImageUrl: String
    notes: String
    deliveryMan: DeliveryProfile
  }

  # --- Payment ---

  type Payment {
    id: ID!
    orderId: ID!
    amount: Float!
    method: PaymentMethod!
    status: PaymentStatus!
    transactionId: String
    createdAt: DateTime!
  }

  # --- Review ---

  type Review {
    id: ID!
    authorId: ID!
    vendorId: ID
    deliveryManId: ID
    orderId: ID!
    rating: Int!
    comment: String
    createdAt: DateTime!
    author: User!
    vendor: VendorProfile
    deliveryMan: DeliveryProfile
  }

  # --- Analytics ---

  type PlatformStats {
    totalUsers: Int!
    totalOrders: Int!
    totalRevenue: Float!
    activeVendors: Int!
    pendingOrders: Int!
  }

  type DailyStats {
    date: String!
    count: Int!
    revenue: Float!
  }

  type VendorStats {
    vendor: VendorProfile!
    totalOrders: Int!
    totalRevenue: Float!
  }

  type VendorMyStats {
    totalOrders: Int!
    pendingOrders: Int!
    totalRevenue: Float!
    totalProducts: Int!
  }

  # --- Platform Settings ---

  type PlatformSettings {
    id: ID!
    baseDeliveryFee: Float!
    pricePerKm: Float!
    defaultCommission: Float!
    coverageZones: JSON
    maintenanceMode: Boolean!
  }

  # --- Audit ---

  type AuditLog {
    id: ID!
    adminId: ID!
    action: String!
    entity: String!
    entityId: String!
    details: JSON
    ipAddress: String
    createdAt: DateTime!
    admin: User!
  }

  # --- Inputs ---

  input RegisterInput {
    phone: String!
    email: String
    password: String!
    firstName: String!
    lastName: String!
    role: UserRole!
  }

  input LoginInput {
    phone: String!
    password: String!
  }

  input CreateProductInput {
    name: String!
    description: String
    price: Float!
    stock: Int!
    imageUrls: [String!]
    category: String!
  }

  input UpdateProductInput {
    name: String
    description: String
    price: Float
    stock: Int
    imageUrls: [String!]
    category: String
  }

  input OrderItemInput {
    productId: ID!
    quantity: Int!
  }

  input CreateOrderInput {
    vendorId: ID!
    items: [OrderItemInput!]!
    deliveryAddress: String!
    deliveryLat: Float!
    deliveryLng: Float!
    paymentMethod: PaymentMethod!
    notes: String
  }

  input UserFilters {
    role: UserRole
    status: UserStatus
    search: String
    limit: Int
    offset: Int
  }

  input ProductFilters {
    status: ProductStatus
    vendorId: ID
    category: String
    search: String
    limit: Int
    offset: Int
  }

  input OrderFilters {
    status: OrderStatus
    clientId: ID
    vendorId: ID
    deliveryManId: ID
    limit: Int
    offset: Int
  }

  input UpdateDeliveryProfileInput {
    vehicleType: String
    licenseNumber: String
  }

  input UpdateSettingsInput {
    baseDeliveryFee: Float
    pricePerKm: Float
    defaultCommission: Float
    maintenanceMode: Boolean
  }

  input CreateReviewInput {
    orderId: ID!
    vendorId: ID
    deliveryManId: ID
    rating: Int!
    comment: String
  }

  # --- Queries ---

  type Query {
    me: User

    # Users (admin)
    users(filters: UserFilters): [User!]!
    user(id: ID!): User

    # Vendors
    vendors(filters: UserFilters): [VendorProfile!]!
    vendor(id: ID!): VendorProfile
    nearbyVendors(lat: Float!, lng: Float!, radiusKm: Float): [VendorProfile!]!

    # Products
    products(filters: ProductFilters): [Product!]!
    product(id: ID!): Product
    myProducts: [Product!]!
    myVendorProfile: VendorProfile
    myVendorStats: VendorMyStats!

    # Orders
    orders(filters: OrderFilters): [Order!]!
    order(id: ID!): Order
    myOrders: [Order!]!
    myFavoriteDeliveryMan: DeliveryProfile

    # Analytics (admin)
    platformStats: PlatformStats!
    ordersOverTime(days: Int): [DailyStats!]!
    topVendors(limit: Int): [VendorStats!]!

    # Settings
    platformSettings: PlatformSettings

    # Audit
    auditLogs(limit: Int, offset: Int): [AuditLog!]!
  }

  # --- Mutations ---

  type Mutation {
    # Auth
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    logout: Boolean!

    # User management (admin)
    updateUserStatus(id: ID!, status: UserStatus!): User!
    deleteUser(id: ID!): Boolean!

    # Products
    createProduct(input: CreateProductInput!): Product!
    updateProduct(id: ID!, input: UpdateProductInput!): Product!
    deleteProduct(id: ID!): Boolean!
    moderateProduct(id: ID!, status: ProductStatus!, rejectionNote: String): Product!

    # Orders
    createOrder(input: CreateOrderInput!): Order!
    updateOrderStatus(id: ID!, status: OrderStatus!): Order!
    assignDeliveryMan(orderId: ID!, deliveryManId: ID!): Delivery!
    cancelOrder(id: ID!): Order!

    # Delivery tracking
    updateDeliveryLocation(orderId: ID!, lat: Float!, lng: Float!): Delivery!
    confirmPickup(orderId: ID!): Delivery!
    confirmDelivery(orderId: ID!, proofImageUrl: String): Delivery!

    # Settings (admin)
    updatePlatformSettings(input: UpdateSettingsInput!): PlatformSettings!

    # Reviews
    createReview(input: CreateReviewInput!): Review!

    # Delivery profile (livreur self-service)
    updateDeliveryProfile(input: UpdateDeliveryProfileInput!): DeliveryProfile!
    updateDeliveryAvailability(isAvailable: Boolean!): DeliveryProfile!

    # Favorites
    setFavoriteDeliveryMan(deliveryManId: ID): Boolean!

    # Notifications (Firebase FCM)
    registerFcmToken(token: String!): Boolean!
  }

  # --- Subscriptions ---

  type Subscription {
    orderStatusChanged(orderId: ID!): Order!
    deliveryLocationUpdated(orderId: ID!): Delivery!
    newOrder(vendorId: ID!): Order!
    # Produits : mis à jour en temps réel pour les clients
    productAdded: Product!
    productUpdated: Product!
  }
`;
