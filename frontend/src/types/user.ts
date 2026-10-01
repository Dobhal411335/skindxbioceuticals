export type UserId = string;

export type UserAddress = {
  id: string;
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
};

export type UserProfile = {
  id: UserId;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  addresses?: UserAddress[];
};
