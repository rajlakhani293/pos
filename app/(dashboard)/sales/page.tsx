"use client";

import { useMemo, useState, useCallback } from "react";
import { useTableData } from "@/hooks/useTableData";
import DynamicTable from "@/components/DynamicTable";
import { sales } from "@/lib/api/sales";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { showToast } from "@/lib/toast";
import CustomDrawer from "@/components/CustomDrawer";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type InvoiceTransaction = {
  id: number;
  item_id: number;
  item__item_code?: string;
  item__item_name?: string;
  item__primary_unit__short_name?: string;
  item_quantity: number | string;
  item_rate: number | string;
  total_amount: number | string;
  item_description?: string;
  discount_percentage?: number | string;
  discount_amount?: number | string;
  tax_amount?: number | string;
};

type SalesInvoiceData = {
  sales: {
    id: number;
    sales_code?: string;
    created_at?: string;
    subtotal?: number | string;
    tax_amount?: number | string;
    discount_percentage?: number | string;
    discount_amount?: number | string;
    total_amount?: number | string;
    paid_amount?: number | string;
    balance_amount?: number | string;
    payment_mode?: number | string;
    payment_mode_label?: string;
    notes?: string;
  };
  party?: {
    id?: number;
    name?: string;
    phone_number?: string;
    email?: string;
    address?: string;
    pincode?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  shop?: {
    id?: number;
    shop_name?: string;
    phone_number?: string;
    email?: string;
    address?: string;
    pincode?: string;
    city?: string;
    state?: string;
    country?: string;
    tax_no?: string;
    pan_no?: string;
    logo_image?: string;
    website_url?: string;
  };
  transactions: InvoiceTransaction[];
};

const toNumber = (value: number | string | undefined | null) => Number(value || 0);
const formatMoney = (value: number | string | undefined | null) => `₹${toNumber(value).toFixed(2)}`;

const Sales = () => {
  const router = useRouter();
  const [getSalesView] = sales.useGetSalesViewMutation();
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState<SalesInvoiceData | null>(null);

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

  const handleRowClick = useCallback(async (record: any) => {
    if (!record?.id) return;
    setInvoiceOpen(true);
    setInvoiceData(null);
    try {
      const result = await getSalesView({ id: Number(record.id) }).unwrap() as { data?: SalesInvoiceData };
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
          invoiceData?.sales?.sales_code
            ? `Invoice ${invoiceData.sales.sales_code}`
            : "Invoice details"
        }
        footer={false}
        width={700}
      >
        {invoiceData ? (
          <div className="space-y-6">
            <div className="text-sm text-muted-foreground">
              {invoiceData.sales?.created_at &&
                `Created: ${dayjs(invoiceData.sales.created_at).format("DD MMM YYYY, hh:mm A")}`
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
                  {invoiceData.transactions?.length ? (
                    invoiceData.transactions.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>
                          <div className="font-medium">{line.item__item_name || line.item_description || "Item"}</div>
                          <div className="text-xs text-muted-foreground">
                            {[line.item__item_code, line.item__primary_unit__short_name && `Unit: ${line.item__primary_unit__short_name}`]
                              .filter(Boolean)
                              .join(" • ")}
                          </div>
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
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatMoney(invoiceData.sales?.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium">{formatMoney(invoiceData.sales?.tax_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="font-medium">{formatMoney(invoiceData.sales?.discount_amount)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>{formatMoney(invoiceData.sales?.total_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="font-medium">{formatMoney(invoiceData.sales?.paid_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Balance</span>
                  <span className="font-medium">{formatMoney(invoiceData.sales?.balance_amount)}</span>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="flex h-40 items-center justify-center p-6 text-sm text-muted-foreground">
            Loading invoice details...
          </div>
        )}
      </CustomDrawer>
    </>
  );
};

export default Sales;
