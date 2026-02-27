import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: number;
  name: string;
  email?: string;
  mobile_no?: string;
  role?: string;
}

interface Shop {
  id: number;
  name: string;
  legal_name?: string;
  logo_image?: string;
  website_url?: string;
  business_type_id?: number;
  tax_no?: string;
  pan_no?: string;
  address?: string;
  city?: string;
  pincode?: string;
  country_id?: number;
  state_id?: number;
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
  shop: Shop | null;
  shopList: any[];
  isSessionLoaded: boolean;
}

const initialState: SessionState = {
  isUnauthorized: false,
  permissionError: null,
  sessionUpdateMessage: null,
  serverError: null,
  user: null,
  shop: null,
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
      // Handle raw API response structure
      if (data.user) state.user = data.user;
      if (data.shop) state.shop = data.shop;
      if (data.shop_list) state.shopList = data.shop_list;
    },
    clearSessionData: (state) => {
      state.user = null;
      state.shop = null;
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