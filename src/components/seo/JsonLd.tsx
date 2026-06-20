/**
 * Renders a JSON-LD <script> for structured data (schema.org). Server component
 * — safe to use in layouts/pages. Pass one object or an array of schema objects.
 */
export function JsonLd({
  data,
}: {
  data: Record<string, unknown> | Record<string, unknown>[];
}) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is trusted (our own data), not user HTML.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
