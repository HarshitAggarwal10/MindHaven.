export async function GET(request, { params }) {
  try {
    const slug = params.slug;
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get("sort") || "newest";

    const response = await fetch(`http://localhost:8000/api/community/${slug}/posts/?ordering=${sort}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return Response.json({ error: "Failed to fetch posts" }, { status: response.status });
    }

    return Response.json(await response.json());
  } catch (error) {
    console.error("Error fetching posts:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const slug = params.slug;
    const body = await request.json();

    const response = await fetch(`http://localhost:8000/api/community/${slug}/posts/`, {
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
    console.error("Error creating post:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
