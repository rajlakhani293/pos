"use client";

import { useMemo, useState, useCallback } from "react";
import { useTableData } from "@/hooks/useTableData";
import DynamicTable from "@/components/DynamicTable";
import { sales } from "@/lib/api/sales";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { showToast } from "@/lib/toast";
import CustomDrawer from "@/components/CustomDrawer";
import { Edit } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PAYMENT_MODE_CHOICES } from "@/lib/utils/constants";

const toNumber = (value: number | string | undefined | null) => Number(value || 0);
const formatMoney = (value: number | string | undefined | null) => `₹${toNumber(value).toFixed(2)}`;

const getPaymentModeLabel = (mode: number) => {
  const paymentMode = PAYMENT_MODE_CHOICES.find(choice => choice.value === mode);
  return paymentMode?.label || 'Unknown';
};

const Sales = () => {
  const router = useRouter();
  const [getSalesView] = sales.useGetSalesViewMutation();
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);

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

  const handleRowClick = useCallback(async (record: any) => {
    if (!record?.id) return;
    setInvoiceOpen(true);
    setInvoiceData(null);
    try {
      const result:any = await getSalesView({ id: Number(record.id) }).unwrap();
      setInvoiceData(result?.data || null);
    } catch (error: any) {
      const errorData = error?.data;
      showToast.error(errorData?.message || "Failed to load sales invoice");
    } finally {
    }
  }, [getSalesView]);


  const rowActions = useCallback((id: any, record: any) => {
    return [
      {
        key: "update",
        label: "Update",
        labelText: "Update",
        icon: <Edit className="size-5" />,
        onClick: () => {
          router.push(`/sales/${id}`);
        },
        priority: 1,
      },
    ];
  }, [router]);

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
      },
      {
        key: "status",
        title: "Status",
        render: (value: number) => {
          if (value === 3) {
            return (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                Fully Returned
              </span>
            );
          }
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Active
            </span>
          );
        }
      }
    ],
    [currentPage, itemsPerPage, PAYMENT_MODE_CHOICES]
  );

  return (
    <>
    <div className="h-full">
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
        rowActions={rowActions}
        onRowClick={handleRowClick}
      />


      <CustomDrawer
        isOpen={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
        title="Sales Invoice"
        subtitle={
          invoiceData?.sales_code
            ? `Invoice ${invoiceData.sales_code}`
            : "Invoice details"
        }
        footer={false}
        width={700}
        isLoading={!invoiceData}
      >
        <>
          <div className="space-y-6">
            <div className="text-sm text-muted-foreground">
              {invoiceData?.sales_date &&
                `Created: ${dayjs(invoiceData.sales_date).format("DD MMM YYYY, hh:mm A")}`
              }
            </div>
            <div className="w-full overflow-hidden border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Tax</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoiceData?.transactions?.length ? (
                    invoiceData.transactions.map((line: any) => (
                      <TableRow key={line.id}>
                        <TableCell>
                          <div className="font-medium">{line.item_description || `Item ID: ${line.item_id}`}</div>
                        </TableCell>
                        <TableCell className="text-right">{toNumber(line.item_quantity).toFixed(2)}</TableCell>
                        <TableCell className="text-right">{formatMoney(line.item_rate)}</TableCell>
                        <TableCell className="text-right">{formatMoney(line.tax_amount)}</TableCell>
                        <TableCell className="text-right">
                          {line.discount_percentage ? `${toNumber(line.discount_percentage).toFixed(2)}%` : formatMoney(line.discount_amount)}
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatMoney(line.total_amount)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                        No transactions found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="">
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payment Mode</span>
                  <span className="font-medium">{getPaymentModeLabel(invoiceData?.payment_mode)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Customer</span>
                  <span className="font-medium">{invoiceData?.party?.name}</span>
                </div>
                {invoiceData?.party?.phone_number && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-medium">{invoiceData.party.phone_number}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="">
              <div className="rounded-lg border p-4 space-y-2">
                {(invoiceData?.tax_amount && invoiceData?.tax_amount > 0) || (invoiceData?.discount_amount && invoiceData?.discount_amount > 0) ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatMoney(invoiceData?.subtotal)}</span>
                  </div>
                ) : null}
                {invoiceData?.tax_amount && invoiceData?.tax_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium">{formatMoney(invoiceData?.tax_amount)}</span>
                </div>
                )}
                {invoiceData?.discount_amount && invoiceData?.discount_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="font-medium">{formatMoney(invoiceData?.discount_amount)}</span>
                </div>
                )}
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>{formatMoney(invoiceData?.total_amount)}</span>
                </div>
                {invoiceData?.paid_amount && invoiceData?.paid_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="font-medium">{formatMoney(invoiceData?.paid_amount)}</span>
                </div>
                )}
                {invoiceData?.payment_mode === 3 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Balance</span>
                  <span className="font-medium">{formatMoney(invoiceData?.balance_amount)}</span>
                </div>
                )}
              </div>
            </div>
          </div></>
      </CustomDrawer>
    </div>
    </>
  );
};

export default Sales;
