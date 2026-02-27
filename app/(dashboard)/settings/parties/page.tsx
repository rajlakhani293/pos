"use client";

import { useState, useMemo } from "react";
import { useTableData } from "@/hooks/useTableData";
import DynamicTable from "@/components/DynamicTable";
import { settings } from "@/lib/api/settings";
import { PartyForm } from "./createUpdate";

const Parties = () => {
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
    getMaster: settings.useGetPartiesDataMutation,
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
        key: "name",
        title: "Party Name",
      },
      {
        key: "party_type",
        title: "Party Type",
        render: (value: any) => {
          const partyType: { [key: string]: string } = {
            "1": "Customer",
            "2": "Supplier",
            "3": "Both"
          };
          return partyType[value.toString()] || value;
        }
      },
      {
        key: "phone_number",
        title: "Phone Number",
      },
      {
        key: "customer_category",
        title: "Customer Category",
        render: (value: any) => {
          const customerCategory: { [key: string]: string } = {
            "1": "Regular",
            "2": "Card Holder",
            "3": "Vara (Home Delivery)"
          };
          return customerCategory[value.toString()] || value;
        }
      } 
    ],
    [currentPage, itemsPerPage]
  );

  return (
    <>
      <div className="p-4">
        <DynamicTable
          tableTitle="Parties"
          title="Add Party"
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

      <PartyForm
        isOpen={isAddEntityOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
        id={selectedId?.id}
        title={selectedId ? `Edit Party` : `Add Party`}
      />
    </>
  );
};

export default Parties;