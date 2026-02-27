import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQueryWithInterceptor } from "./base";
import { createMutation, deleteMutation, getMutation, postMutation, putMutation} from "./apiUtils";

const endpointsConfig = {
  getSessionData: { query: () => getMutation("session-data") },

  // Taxes
  getTaxesDropdown: { query: () => getMutation("taxes/dropdown-list") },
  getTaxesData: { query: postMutation("taxes/get-transactions") },
  createTax: { query: createMutation("taxes/") },
  editTax: { query: ({ id, payLoad }: { id: any; payLoad: any }) => putMutation(`taxes/${id}`, payLoad) },
  deleteTax: { query: deleteMutation("taxes/delete") },
  getTaxById: { query: ({ id }: { id: number }) => getMutation(`taxes/${id}`) },

  // Brand
  getBrandsDropdown: { query: () => getMutation("brands/dropdown-list") },
  getBrandsData: { query: postMutation("brands/get-transactions") },
  createBrand: { query: createMutation("brands/") },
  editBrand: { query: ({ id, payLoad }: { id: any; payLoad: any }) => putMutation(`brands/${id}`, payLoad) },
  deleteBrand: { query: deleteMutation("brands/delete") },
  getBrandById: { query: ({ id }: { id: number }) => getMutation(`brands/${id}`) },

  // Parties
  getPartiesDropdown: { query: () => getMutation("parties/dropdown-list") },
  getPartiesData: { query: postMutation("parties/get-transactions") },
  createParty: { query: createMutation("parties/") },
  editParty: { query: ({ id, payLoad }: { id: any; payLoad: any }) => putMutation(`parties/${id}`, payLoad) },
  deleteParty: { query: deleteMutation("parties/delete") },
  getPartyById: { query: ({ id }: { id: number }) => getMutation(`parties/${id}`) },
  
}

export const settings = createApi({
  reducerPath: "settings",
  baseQuery: createBaseQueryWithInterceptor("settings"),
  endpoints: (builder) => {
    const finalEndpoints: Record<string, any> = {};
    for (const [name, config] of Object.entries(endpointsConfig)) {
      if ((config as any).type === "query") {
        finalEndpoints[name] = builder.query(config as any);
      } else {
        finalEndpoints[name] = builder.mutation(config as any);
      }
    }
    return finalEndpoints;
  },
});
