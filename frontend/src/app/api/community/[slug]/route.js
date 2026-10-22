export async function GET(request, { params }) {
  try {
    const slug = params.slug;
    const response = await fetch(`http://localhost:8000/api/community/${slug}/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return Response.json({ error: "Community not found" }, { status: response.status });
    }

    return Response.json(await response.json());
  } catch (error) {
    console.error("Error fetching community detail:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
