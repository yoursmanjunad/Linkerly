export async function POST(request: Request) {
  try {
    const body = await request.json();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/users/register`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    const data = await res.json();

    return Response.json(data, { status: res.status });
  } catch (error) {
    return Response.json({ message: "Registration failed" }, { status: 500 });
  }
}
