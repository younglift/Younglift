import ProductPage from './ProductPage';

export default function Page({ params, searchParams }: { params: { id: string }; searchParams: { from?: string } }) {
  return <ProductPage id={params.id} from={searchParams.from ?? null} />;
}
