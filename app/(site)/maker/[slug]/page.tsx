import MakerWorld from './MakerWorld';

export default function Page({ params, searchParams }: { params: { slug: string }; searchParams: { from?: string; tab?: string } }) {
  return <MakerWorld slug={params.slug} from={searchParams.from ?? null} tab={searchParams.tab ?? null} />;
}
