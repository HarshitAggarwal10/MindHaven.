export async function GET(request) {
  try {
    const response = await fetch("http://localhost:8000/api/community/membership/", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return Response.json({ error: "Failed to fetch memberships" }, { status: response.status });
    }

    return Response.json(await response.json());
  } catch (error) {
    console.error("Error fetching memberships:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
