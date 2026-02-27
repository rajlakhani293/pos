import { createApi, type EndpointBuilder } from "@reduxjs/toolkit/query/react";
import { createBaseQueryWithInterceptor } from "./base";

interface SignupResponse {
  success: boolean;
  token?: string;
  message?: string;
}

interface SendOtpRequest {
  phone_number: string;
}

interface SendOtpResponse {
  code: number;
  success: string;
  message: string;
  data:{
    otp_code: string;
  }
}

interface VerifyOtpRequest {
  phone_number: string;
  otp_code: string;
}

interface VerifyOtpResponse {
  code: number;
  status: string;
  message: string;
  data: {
    message: string;
    registration_token: string;
  };
}

interface RegisterRequest {
  registration_token: string;
  shop_name: string;
  legal_name?: string;
  user_name: string;
  email?: string;
  password?: string;
  mobile_no?: string;
  country_id?: number;
  state_id?: number;
  city?: string;
  pincode?: string;
  address?: string;
  tax_no?: string;
  pan_no?: string;
  business_type_id?: number;
  logo_image?: File;
  website_url?: string;
}

interface RegisterResponse {
  success: boolean;
  code: number;
  message: string;
  data: any;
}

export const auth = createApi({
  reducerPath: "auth",
  baseQuery: createBaseQueryWithInterceptor(""),
  endpoints: (builder: EndpointBuilder<any, any, any>) => ({

    // Login Send OTP Api
    sendLoginOtp: builder.mutation({
      query: (payload: any) => ({
        url: "auth/send-login-otp",
        method: "POST",
        body: payload,
      }),
    }),

    // Login Api
    signin: builder.mutation({
      query: (payload: any) => ({
        url: "auth/login",
        method: "POST",
        body: payload,
      }),
    }),

    // Signup Send OTP Api
    sendOtp: builder.mutation<SendOtpResponse, SendOtpRequest>({
      query: (credentials: SendOtpRequest) => ({
        url: "auth/send-otp",
        method: "POST",
        body: credentials,
      }),
    }),

    // Signup Verify OTP Api
    verifyOtp: builder.mutation<VerifyOtpResponse, VerifyOtpRequest>({
      query: (credentials: VerifyOtpRequest) => ({
        url: "auth/verify-otp",
        method: "POST",
        body: credentials,
      }),
    }),

    // Signup Register Api
    signup: builder.mutation<RegisterResponse, RegisterRequest | FormData>({
      query: (credentials: RegisterRequest | FormData) => ({
        url: "auth/register-shop",
        method: "POST",
        body: credentials,
      }),
    }),
    
 
    // Logout Api
    logout: builder.mutation<SignupResponse, { refresh_token?: string }>({
      query: ({ refresh_token }) => ({
        url: `auth/logout`,
        method: "POST",
        body: { refresh_token },
      }),
    }),
    
  }),
});

// Export hooks for the new endpoints
export const {
  useSendLoginOtpMutation,
  useSendOtpMutation,
  useVerifyOtpMutation,
  useSigninMutation,
  useSignupMutation,
  useLogoutMutation,
} = auth;