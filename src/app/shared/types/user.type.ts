import { Address, UserRoles } from '../../core/auth/auth.types';

export type RestaurantUserType = {
  role: 'restaurant'
  id: string
  email: string
  username: string
  phoneNumber: string
  restaurantId: string
  restaurantName: string
  restaurantAddress: Address | null
  dailyStockResetTime?: string
}

export type DelivererUserType = {
  role: 'deliverer'
  id: string
  email: string
  username: string
  phoneNumber: string
  delivererId: string
  availability: 'Available' | 'Unavailable'
  isExpert: boolean
  walletBalance: number
  deliveriesCount: number
}

export type ClientUserType = {
  role: UserRoles
  id: string
  email: string
  username: string
  phoneNumber: string
  clientId: string
  address: Address | null
}

export type UserType = ClientUserType | DelivererUserType | RestaurantUserType;
