import { Address } from '../../../../core/auth/auth.types';

export type RestaurantProfileResponse = {
  id: string;
  name: string;
  address: {
    streetNumber: number;
    addressLine: string;
    addressLineExtra: string;
    city: string;
    zipCode: string;
    latitude: number;
    longitude: number;
  } | null;
};

export type UpdateRestaurantDto = {
  restaurantName?: string;
  address?: {
    streetNumber: number;
    addressLine: string;
    addressLineExtra?: string;
    city: string;
    zipCode: string;
    latitude: number;
    longitude: number;
  };
  restaurantOwner?: {
    email?: string;
    username?: string;
    phoneNumber?: string;
  };
};

export type SetResetTimeDto = {
  resetTime: string;
  restaurantId: string;
};

export type ChangePasswordDto = {
  currentPassword: string;
  newPassword: string;
};

export type RestaurantWithDistance = {
  distance: number;
  restaurant: RestaurantInfoType;
};

export type RestaurantInfoType = {
  id: string;
  name: string;
  address: Address;
  imageUrl: string | null;
};
