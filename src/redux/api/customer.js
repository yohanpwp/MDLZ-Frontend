import { api } from "./baseApi";

export const customerApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query({
      query: (params) => {
        if (!params) {
          return "/customers";
        }
        const searchParams = new URLSearchParams();
        if (params.page !== undefined) {
          searchParams.append("page", String(params.page));
        }
        if (params.pageSize !== undefined) {
          searchParams.append("pageSize", String(params.pageSize));
        }
        if (params.search !== undefined) {
          searchParams.append("search", String(params.search));
        }
        if (params.orderedBy !== undefined) {
          searchParams.append("orderedBy", String(params.orderedBy));
        }
        return `/customers?${searchParams.toString()}`;
      },
      providesTags: (res) =>
        res
          ? [res.data.map((o) => ({ type: "Customers", id: o.id })), "Customers"]
          : ["Customers"],
    }),
    updateCustomer: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/customers/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: (_res, _err, arg) => [{ type: "Customers", id: arg.id }],
    }),
  }),
});

export const { useGetCustomersQuery, useUpdateCustomerMutation } = customerApi;
