"use client";

import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { items } from "@/lib/api/items";
import { useTableData } from "@/hooks/useTableData";
import DynamicTable from "@/components/DynamicTable";
import StockForm from "@/components/StockForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MOVEMENT_LABELS } from "@/lib/utils/constants";

interface StockViewProps {
  direction: "IN" | "OUT";
}

function StockView({ direction }: StockViewProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [showForm, setShowForm] = useState(false);

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
    getMaster: items.useGetStockTransactionsMutation,
    itemsPerPage: 20,
    extraOptions: {
      filter: { direction },
      refresh_key: refreshKey,
    },
  });

  const refreshAll = async () => {
    setRefreshKey((prev) => prev + 1);
  };

  const columns = useMemo(
    () => [
      {
        key: "created_at",
        title: "Date",
        render: (value: string) => dayjs(value).format("DD MMM YYYY, hh:mm A"),
      },
      { key: "item_name", title: "Item" },
      {
        key: "movement_type",
        title: "Type",
        render: (value: string) => MOVEMENT_LABELS[value] || value,
      },
      { key: "direction", title: "Direction" },
      { key: "quantity", title: "Qty" },
      { key: "balance_after", title: "Balance" },
      { key: "reference_type", title: "Ref Type" },
      { key: "note", title: "Note" },
    ],
    []
  );

  return (
    <>
      <DynamicTable
        tableTitle={`Stock ${direction === "IN" ? "In" : "Out"} Transactions`}
        title={`Add Stock ${direction === "IN" ? "In" : "Out"}`}
        setAddEntityOpen={() => setShowForm(true)}
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
        hideActions={true}
        isLoading={isLoading}
      />
      <StockForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={refreshAll}
        type={direction}
        title={`Add Stock ${direction === "IN" ? "In" : "Out"}`}
      />
    </>
  );
}

const StockAdjustmentsPage = () => {
    return (
        <>
            <Tabs defaultValue="stock-in" className="flex flex-col w-full h-full">
                <TabsList className="mb-4 inline-flex">
                    <TabsTrigger value="stock-in">Stock In</TabsTrigger>
                    <TabsTrigger value="stock-out">Stock Out</TabsTrigger>
                </TabsList>
                <div className="flex-1 w-full h-full">
                    <TabsContent value="stock-in" className="h-full w-full">
                        <StockView direction="IN" />
                    </TabsContent>
                    <TabsContent value="stock-out" className="h-full w-full">
                        <StockView direction="OUT" />
                    </TabsContent>
                </div>
            </Tabs>
        </>
    );
};

export default StockAdjustmentsPage;