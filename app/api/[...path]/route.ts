export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const { search } = new URL(req.url);
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_HOST}/${path.join('/')}${search}`, {
    headers: { Authorization: `Bearer ${process.env.BEARER_TOKEN}`},
  });
  return new Response(res.body, { status: res.status, headers: res.headers });
}