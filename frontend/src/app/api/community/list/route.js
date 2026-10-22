export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const url = q
      ? `http://localhost:8000/api/community/list/?q=${encodeURIComponent(q)}`
      : "http://localhost:8000/api/community/list/";

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return Response.json({ error: "Failed to fetch communities" }, { status: response.status });
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error("Error in community list API route:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
