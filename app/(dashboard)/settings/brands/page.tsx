"use client";

import { useState, useMemo } from "react";
import { useTableData } from "@/hooks/useTableData";
import DynamicTable from "@/components/DynamicTable";
import { settings } from "@/lib/api/settings";
import { BrandForm } from "./createUpdate";

const Brands = () => {
  const [isAddEntityOpen, setAddEntityOpen] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
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
    getMaster: settings.useGetBrandsDataMutation,
    itemsPerPage: 20,
    extraOptions: { refreshTrigger },
  });

  const handleCreateItem = () => {
    setSelectedId(null);
    setAddEntityOpen(true);
  };

  const handleEditItem = (item: any) => {
    setSelectedId(item);
    setAddEntityOpen(true);
  };

  const handleClose = () => {
    setAddEntityOpen(false);
    setSelectedId(null);
  };

  const handleSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    handleClose();
  };

  const columns = useMemo(
    () => [
      {
        key: "brand_name",
        title: "Brand Name",
      }
    ],
    [currentPage, itemsPerPage]
  );

  return (
    <>
      <div className="p-4">
        <DynamicTable
          tableTitle="Brands"
          title="Add Brand"
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

      <BrandForm
        isOpen={isAddEntityOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
        id={selectedId?.id}
        title={selectedId ? `Edit Brand` : `Add Brand`}
      />
    </>
  );
};

export default Brands;
