import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: number;
  user_name: string;
  email?: string;
  phone_number?: string;
  is_superuser?: boolean;
  is_staff?: boolean;
  is_active?: boolean;
  is_verified?: boolean;
  last_login?: string;
  address?: string;
  pincode?: string;
  profile_image?: string;
  city_id?: number;
  state_id?: number;
  country_id?: number;
  company_id?: number;
  branch_id?: number;
  has_password?: boolean;
  branch_access?: number[];
  groups?: any[];
  user_permissions?: any[];
}

interface Company {
  id: number;
  company_name: string;
  company_code: string;
  logo_image_url?: string;
  website_url?: string;
  business_type_id?: number;
  tax_no?: string;
  pan_no?: string;
  address?: string;
  pincode?: string;
  phone_number?: string;
  email?: string;
  city_id?: number;
  state_id?: number;
  country_id?: number;
  owner_id?: number;
}

interface Branch {
  id: number;
  branch_name: string;
  contact_person_name?: string;
  phone_number?: string;
  email?: string;
  address?: string;
  pincode?: string;
  city_id?: number;
  state_id?: number;
  country_id?: number;
  company_id?: number;
}

interface SessionState {
  isUnauthorized: boolean;
  permissionError: {
    isError: boolean;
    code: string;
    errors: any;
  } | null;
  sessionUpdateMessage: string | null;
  serverError: {
    isError: boolean;
    message: string;
    code?: number;
  } | null;
  user: User | null;
  company: Company | null;
  branch: Branch | null;
  shopList: any[];
  isSessionLoaded: boolean;
}

const initialState: SessionState = {
  isUnauthorized: false,
  permissionError: null,
  sessionUpdateMessage: null,
  serverError: null,
  user: null,
  company: null,
  branch: null,
  shopList: [],
  isSessionLoaded: false,
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setUnauthorized: (state, action: PayloadAction<boolean>) => {
      state.isUnauthorized = action.payload;
    },
    setPermissionError: (state, action: PayloadAction<SessionState['permissionError']>) => { 
      state.permissionError = action.payload; 
    },
    setSessionUpdate: (state, action: PayloadAction<string | null>) => {
      state.sessionUpdateMessage = action.payload;
    },
    setServerError: (state, action: PayloadAction<{ isError: boolean; message: string; code?: number } | null>) => {
      state.serverError = action.payload;
    },
    setSessionData: (state, action: PayloadAction<any>) => {
      const data = action.payload;
      // Handle new API response structure
      if (data.user) state.user = data.user;
      if (data.company) state.company = data.company;
      if (data.branch) state.branch = data.branch;
      if (data.shop_list) state.shopList = data.shop_list;
      // Backward compatibility: handle old shop field if present
      if (data.shop) state.company = data.shop;
    },
    clearSessionData: (state) => {
      state.user = null;
      state.company = null;
      state.branch = null;
      state.shopList = [];
      state.isSessionLoaded = false;
      state.isUnauthorized = false;
      state.permissionError = null;
      state.sessionUpdateMessage = null;
      state.serverError = null;
    },
  },
});

export const { 
  setUnauthorized, 
  setPermissionError,
  setSessionUpdate,
  setServerError,
  setSessionData,
  clearSessionData
} = sessionSlice.actions;

export default sessionSlice.reducer;