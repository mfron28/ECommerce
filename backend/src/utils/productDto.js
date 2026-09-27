export function productDto(p) {
  const images =
    Array.isArray(p.images) && p.images.length > 0
      ? p.images
      : p.image
        ? [p.image]
        : [];
  return {
    id: p._id.toString(),
    name: p.name,
    description: p.description,
    price: p.price,
    image: images[0] || p.image || "",
    images,
    stock: p.stock,
    category: p.category,
    ratingAvg: p.ratingAvg ?? 0,
    ratingCount: p.ratingCount ?? 0,
    lowStockThreshold: p.lowStockThreshold ?? 5,
    isLowStock: (p.stock ?? 0) > 0 && (p.stock ?? 0) <= (p.lowStockThreshold ?? 5),
  };
}
