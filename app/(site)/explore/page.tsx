import Explore from './Explore';

export default function Page({ searchParams }: { searchParams: { cat?: string; q?: string } }) {
  return <Explore cat={searchParams.cat ?? null} q={searchParams.q ?? ''} />;
}
