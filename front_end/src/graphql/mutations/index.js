import { gql } from '@apollo/client';

export const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user { id phone firstName lastName role status }
    }
  }
`;

export const LOGOUT = gql`
  mutation Logout { logout }
`;

export const UPDATE_USER_STATUS = gql`
  mutation UpdateUserStatus($id: ID!, $status: UserStatus!) {
    updateUserStatus(id: $id, status: $status) { id status }
  }
`;

export const DELETE_USER = gql`
  mutation DeleteUser($id: ID!) { deleteUser(id: $id) }
`;

export const MODERATE_PRODUCT = gql`
  mutation ModerateProduct($id: ID!, $status: ProductStatus!, $rejectionNote: String) {
    moderateProduct(id: $id, status: $status, rejectionNote: $rejectionNote) { id status rejectionNote }
  }
`;

export const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatus($id: ID!, $status: OrderStatus!) {
    updateOrderStatus(id: $id, status: $status) { id status }
  }
`;

export const ASSIGN_DELIVERY_MAN = gql`
  mutation AssignDeliveryMan($orderId: ID!, $deliveryManId: ID!) {
    assignDeliveryMan(orderId: $orderId, deliveryManId: $deliveryManId) {
      id deliveryManId
      deliveryMan { user { firstName lastName } }
    }
  }
`;

export const UPDATE_PLATFORM_SETTINGS = gql`
  mutation UpdatePlatformSettings($input: UpdateSettingsInput!) {
    updatePlatformSettings(input: $input) {
      id baseDeliveryFee pricePerKm defaultCommission maintenanceMode
    }
  }
`;

export const REGISTER_FCM_TOKEN = gql`
  mutation RegisterFcmToken($token: String!) {
    registerFcmToken(token: $token)
  }
`;

export const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($id: ID!, $input: UpdateProductInput!) {
    updateProduct(id: $id, input: $input) {
      id name imageUrls status
    }
  }
`;

export const CONFIRM_PICKUP = gql`
  mutation ConfirmPickup($orderId: ID!) {
    confirmPickup(orderId: $orderId) {
      id orderId pickedUpAt
    }
  }
`;

export const CONFIRM_DELIVERY = gql`
  mutation ConfirmDelivery($orderId: ID!, $proofImageUrl: String) {
    confirmDelivery(orderId: $orderId, proofImageUrl: $proofImageUrl) {
      id orderId deliveredAt proofImageUrl
    }
  }
`;

export const UPDATE_DELIVERY_LOCATION = gql`
  mutation UpdateDeliveryLocation($orderId: ID!, $lat: Float!, $lng: Float!) {
    updateDeliveryLocation(orderId: $orderId, lat: $lat, lng: $lng) {
      id orderId currentLat currentLng
    }
  }
`;
