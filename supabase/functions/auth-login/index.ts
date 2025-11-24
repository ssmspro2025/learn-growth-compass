export default async (req: Request) => {
  try {
    const data = await req.json().catch(() => ({}));
    const email = data?.email ?? null;
    const body = { ok: true, message: 'auth-login placeholder', email };
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
