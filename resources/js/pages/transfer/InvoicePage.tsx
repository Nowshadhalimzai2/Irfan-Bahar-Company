import ThermalReceipt, { ReceiptData } from "@/components/ThermalReceipt";
import { usePage } from "@inertiajs/react";

type TransferLine = {id:number,itemName:string,quantity:number;unit_price:number};
type TransferData = {id:number,source:string,destination:string,reference_no:string,transfered_at:Date,lines:TransferLine[]}
interface Props{
  transfer: TransferData;
}
export default function InvoicePage({transfer}:Props) {

  const userName = usePage().props.auth.user.name;
  
  const invoice: ReceiptData = {
    storeName: "Irfan Bahar Detergent Company",
    invoiceNumber: transfer.reference_no,
    date: new Date(transfer.transfered_at).toLocaleString('fa-AF'),
    cashier: userName,
    items: transfer.lines,
    discount: 0,
    paid: 0,
    paymentMethod: "none",
    currency: "AFN",
  };
  return <ThermalReceipt receipt={invoice} />;
}