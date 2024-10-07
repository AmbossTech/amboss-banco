import { TransactionDetail } from '@/views/transactions/TransactionDetail';

export default function Page({ params }: { params: { id: string } }) {
  return <TransactionDetail id={params.id} />;
}
