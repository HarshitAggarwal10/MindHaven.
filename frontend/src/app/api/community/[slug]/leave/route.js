export async function POST(request, { params }) {
  try {
    const slug = params.slug;

    const response = await fetch(`http://localhost:8000/api/community/${slug}/leave/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return Response.json({ error: "Failed to leave community" }, { status: response.status });
    }

    return Response.json(await response.json());
  } catch (error) {
    console.error("Error leaving community:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
