export async function executeAction(action, params) {
  const allowed = ["createOrder", "getOrders"];
  if (!allowed.includes(action)) throw new Error("Unauthorized action");

  if (action === "createOrder") {
    return { order_id: "ORD-" + Math.floor(Math.random() * 1000), ...params };
  }
  if (action === "getOrders") {
    return [
      { id: "1", product: "pizza", quantity: 1 },
      { id: "2", product: "pasta", quantity: 2 }
    ];
  }
}