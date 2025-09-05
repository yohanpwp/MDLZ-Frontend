import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { logoutUser } from "../slices/authSlice";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: "/api",
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState()).auth.token;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

const baseQuery = async (args, api, extra) => {
  const res = await rawBaseQuery(args, api, extra);
  if (res.error?.status === 401) {
    (api.dispatch)(logoutUser())
  }
  return res;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: ["Users", "Customers", "Products", "Distributors", "Invoices", "Creditnotes"],
  endpoints: () => ({}),     // ว่างไว้ แล้วค่อย inject ตาม feature
});