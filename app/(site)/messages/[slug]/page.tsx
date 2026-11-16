import Chat from './Chat';

export default function Page({ params, searchParams }: { params: { slug: string }; searchParams: { tab?: string; product?: string; from?: string } }) {
  return <Chat slug={params.slug} tab={searchParams.tab === 'request' ? 'req' : 'msg'} productId={searchParams.product ?? null} from={searchParams.from ?? null} />;
}
