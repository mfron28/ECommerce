export function StarRating({ value = 0, size = "1rem" }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const filled = value >= i - 0.25;
    const half = !filled && value >= i - 0.75;
    stars.push(
      <span
        key={i}
        style={{
          color: filled || half ? "#fbbf24" : "var(--border)",
          fontSize: size,
        }}
        aria-hidden
      >
        {filled ? "★" : half ? "★" : "☆"}
      </span>
    );
  }
  return (
    <span style={{ display: "inline-flex", gap: 2 }} title={`${value} out of 5`}>
      {stars}
    </span>
  );
}
