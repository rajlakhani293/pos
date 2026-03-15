import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQueryWithInterceptor } from "./base";
import { createMutation, getMutation, postMutation, putMutation } from "./apiUtils";

const endpointsConfig = {
  // Sales Endpoints
  getSalesData: { query: postMutation("get-transactions") },
  getLedgerTransactions: { query: postMutation("ledger/get-transactions") },
  getLedgerPayments: { query: postMutation("ledger/get-payments") },
  getPartyCreditSummary: { query: postMutation("party-credit-summary") },
  getPartyCreditDays: { query: ({ id, payLoad }: { id: number; payLoad: any }) => postMutation(`party-credit-summary/${id}`)(payLoad) },
  getDashboardStats: { query: postMutation("dashboard-stats") },
  getDashboardCharts: { query: postMutation("dashboard-charts") },
  getDashboardTopProducts: { query: postMutation("dashboard-top-products") },
  createSale: { query: createMutation("") },
  editSale: { query: ({ id, payLoad }: { id: any; payLoad: any }) => putMutation(`${id}`, payLoad) },
  getSaleById: { query: ({ id }: { id: number }) => getMutation(`${id}`) },
  fullReturnSale: { query: ({ id, payLoad }: { id: number; payLoad: any }) => createMutation(`${id}/returns`)(payLoad) },
}

export const sales = createApi({
  reducerPath: "sales",
  baseQuery: createBaseQueryWithInterceptor("sales"),
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
