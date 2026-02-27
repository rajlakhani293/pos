"use client";

import { useMemo } from "react";
import { useTableData } from "@/hooks/useTableData";
import DynamicTable from "@/components/DynamicTable";
import { items } from "@/lib/api/items";
import { useRouter } from "next/navigation";

const Items = () => {
  const router = useRouter();
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
    getMaster: items.useGetItemsDataMutation,
    itemsPerPage: 20,
  });

  const handleCreateItem = () => {
    router.push('/inventory/items/create');
  };

  const handleEditItem = (item: any) => {
    router.push(`/inventory/items/${item.id}`);
  };

  const columns = useMemo(
    () => [
      {
        key: "item_name",
        title: "Item Name",
      },
      {
        key: "item_code",
        title: "Item Code",
      },
      {
        key: "category",
        title: "Category",
      },
      {
        key: "current_stock",
        title: "Current Stock"
      },
      {
        key: "selling_price",
        title: "Sales Price",
      },
      {
        key: "brand",
        title: "Brand",
      }
    ],
    [currentPage, itemsPerPage]
  );

  return (
    <div className="p-4">
      <DynamicTable
        tableTitle="Items"
        title="Add Item"
        showSearch={true}
        searchTerm={searchTerm}
        showDateRange={true}
        selectedDateRange={selectedDateRange}
        dateFilters={dateFilters}
        setAddEntityOpen={handleCreateItem}
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
        showDelete={true}
        isLoading={isLoading}
        onEdit={handleEditItem}
      />
    </div>
  );
};

export default Items;
