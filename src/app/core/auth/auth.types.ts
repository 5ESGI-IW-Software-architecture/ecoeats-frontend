export type UserRoles = 'client' | 'deliverer' | 'restaurant';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
}

export type UserSignup = {
  email: string;
  password: string;
  phoneNumber: string;
  username: string;
}

export type Address = {
  streetNumber: number;
  addressLine: string
  city: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  addressLineExtra: string
}

export type LoginDto = {
  email: string;
  password: string;
  userRole: UserRoles
}

export type DelivererSignup = UserSignup

export type ClientSignup = {
  username: string;
  email: string;
  password: string;
  phoneNumber: string;
  defaultAddress: Address
}

export type RestaurantSignup = {
  restaurantName: string;
  restaurantOwner: {
    email: string;
    password: string;
    phoneNumber: string;
    username: string;
  },
  address: Address
}

export type SignupDto = DelivererSignup | RestaurantSignup | ClientSignup;
