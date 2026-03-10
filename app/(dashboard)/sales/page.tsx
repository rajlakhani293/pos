"use client";

import { useMemo } from "react";
import { useTableData } from "@/hooks/useTableData";
import DynamicTable from "@/components/DynamicTable";
import { sales } from "@/lib/api/sales";
import { useRouter } from "next/navigation";
import { MdOutlineSettingsBackupRestore } from "react-icons/md";
import dayjs from "dayjs";

const Sales = () => {
  const router = useRouter();
  
  // Payment mode choices mapping
  const PAYMENT_MODE_CHOICES = [
    { value: 1, label: 'Cash' },
    { value: 2, label: 'UPI' },
    { value: 3, label: 'Partial' },
    { value: 4, label: 'Bank Transfer' },
  ];

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
    getMaster: sales.useGetSalesDataMutation,
    itemsPerPage: 20,
  });

  const handleCreateSale = () => {
    router.push('/sales/create');
  };

  const columns = useMemo(
    () => [
      {
        key: "sales_code",
        title: "Sales Code",
      },
      {
        key: "party__name",
        title: "Party Name",
      },
      {
        key: "sales_date",
        title: "Sales Date",
        render: (value: string) => dayjs(value).format("DD MMM YYYY, hh:mm A"),  
      },
      {
        key: "total_amount",
        title: "Total Amount"
      },
      {
        key: "payment_mode",
        title: "Payment Mode",
        render: (value: any, record: any) => {
          const paymentMode = PAYMENT_MODE_CHOICES.find(mode => mode.value === value);
          const modeLabel = paymentMode ? paymentMode.label : value;
          
          if (value === 3) { // Partial payment mode
            return (
              <div>
                <div>{modeLabel}</div>
                <div className="text-sm text-muted-foreground">Paid: {record?.row?.paid_amount}</div>
              </div>
            );
          }
          
          return modeLabel;
        }
      }
    ],
    [currentPage, itemsPerPage, PAYMENT_MODE_CHOICES]
  );

  return (
      <DynamicTable
        tableTitle="Sales"
        title="Add Sale"
        showSearch={true}
        searchTerm={searchTerm}
        showDateRange={true}
        selectedDateRange={selectedDateRange}
        dateFilters={dateFilters}
        setAddEntityOpen={handleCreateSale}
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
        rowActions={(id) => {
          return [
            {
              key: "return",
              label: "Return",
              labelText: "Return",
              icon: <MdOutlineSettingsBackupRestore className="size-5" />,
              onClick: () => {
                router.push(`/sales/${id}`);
              },
              priority: 1
            }
          ];
        }}
      />
  );
};

export default Sales;
