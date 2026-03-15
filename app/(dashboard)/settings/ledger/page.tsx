"use client";

import { useMemo } from "react";
import dayjs from "dayjs";
import { useTableData } from "@/hooks/useTableData";
import DynamicTable from "@/components/DynamicTable";
import { sales } from "@/lib/api/sales";

const CustomerLedgerPage = () => {
  const {
    orders,
    totalItems,
    isLoading,
    currentPage,
    setCurrentPage,
    sortConfig,
    handleSort,
    sortableFields,
    handleFilterChange,
    searchTerm,
    selectedDateRange,
    dateFilters,
    itemsPerPage,
  } = useTableData({
    getMaster: sales.useGetLedgerTransactionsMutation,
    itemsPerPage: 20,
  });

  const columns = useMemo(
    () => [
      {
        key: "created_at",
        title: "Date",
        render: (value: string) => dayjs(value).format("DD MMM YYYY, hh:mm A"),
      },
      {
        key: "party__name",
        title: "Party",
      },
      {
        key: "sales__sales_code",
        title: "Sales Code",
      },
      {
        key: "entry_type",
        title: "Type",
      },
      {
        key: "amount",
        title: "Amount",
        render: (value: any) => {
          const amount = Number(value || 0);
          const isNegative = amount < 0;
          return (
            <span className={isNegative ? "text-red-600 font-semibold" : "text-green-700 font-semibold"}>
              {amount.toFixed(2)}
            </span>
          );
        },
      },
      {
        key: "balance_after",
        title: "Balance",
        render: (value: any) => Number(value || 0).toFixed(2),
      },
      {
        key: "reference_type",
        title: "Ref Type",
      },
      {
        key: "reference_id",
        title: "Ref ID",
      },
      {
        key: "note",
        title: "Note",
      },
    ],
    []
  );

  return (
    <DynamicTable
      tableTitle="Customer Ledger"
      showSearch={true}
      searchTerm={searchTerm}
      showDateRange={true}
      selectedDateRange={selectedDateRange}
      dateFilters={dateFilters}
      onFilterChange={handleFilterChange}
      data={orders}
      columns={columns}
      sortConfig={sortConfig}
      onSort={handleSort}
      sortableFields={sortableFields}
      currentPage={currentPage}
      itemsPerPage={itemsPerPage}
      totalItems={totalItems}
      onPageChange={setCurrentPage}
      showDelete={false}
      showEdit={false}
      isLoading={isLoading}
    />
  );
};

export default CustomerLedgerPage;
