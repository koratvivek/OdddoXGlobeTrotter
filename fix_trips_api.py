with open("frontend/src/lib/trips-api.js", "r") as f:
    content = f.read()

target = "export async function fetchTrip(id) {\n  const data = await apiClient(`/trips/${id}`);\n  return normalizeTrip(data);\n}"
target_crlf = target.replace("\n", "\r\n")

replacement = """export async function fetchTrip(id) {
  const data = await apiClient(`/trips/${id}`);
  return normalizeTrip(data);
}

export async function fetchTripBudget(id) {
  return apiClient(`/trips/${id}/budget`);
}"""

if target in content:
    content = content.replace(target, replacement, 1)
elif target_crlf in content:
    content = content.replace(target_crlf, replacement.replace("\n", "\r\n"), 1)

with open("frontend/src/lib/trips-api.js", "w") as f:
    f.write(content)
