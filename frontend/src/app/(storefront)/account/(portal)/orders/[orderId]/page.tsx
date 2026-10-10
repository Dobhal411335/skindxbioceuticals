import { OrderDetailView } from "@/components/account/order-detail-view";

type PageProps = {
  params: Promise<{ orderId: string }>;
};

export default async function AccountOrderDetailPage({ params }: PageProps) {
  const { orderId } = await params;
  return <OrderDetailView orderId={orderId} />;
}
