export async function POST(request, { params }) {
  try {
    const { slug: communityId } = params;
    const body = await request.json();

    const response = await fetch(`http://localhost:8000/api/community/${communityId}/membership/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      return Response.json(error, { status: response.status });
    }

    return Response.json(await response.json());
  } catch (error) {
    console.error("Error joining community:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
