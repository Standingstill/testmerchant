# Test Merchant Store

Sample single-product merchant storefront used to test the EnsureBack integration against Stripe Checkout.

## Features

- One-click checkout for a single demo product (Test Headphones - $99.00)
- Stripe Checkout + PaymentIntent flow with metadata for EnsureBack
- In-memory tracking of order lifecycle events
- Webhook endpoint that records successful payments
- Internal APIs for EnsureBack to query orders, release funds, and request refunds

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment variables by copying `.env` and adding your Stripe test keys:

   ```bash
   cp .env .env.local
   # Edit .env.local with your STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET
   ```

   The application reads `.env` by default. For local development you can use `.env` or `.env.local` (just ensure the values are exported before starting the app).

3. Start the development server:

   ```bash
   npm run dev
   ```

   Or start without hot reloading:

   ```bash
   npm start
   ```

4. Visit [http://localhost:3000](http://localhost:3000) and complete a payment using Stripe's test card `4242 4242 4242 4242`.

## API Endpoints

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| `POST` | `/create-checkout-session` | Creates a Stripe Checkout Session for the demo product. |
| `POST` | `/webhook` | Stripe webhook listener (expects `checkout.session.completed`). |
| `GET` | `/orders` | Lists all known orders with their status. |
| `POST` | `/orders/:id/release` | Simulates releasing escrowed funds for the order. |
| `POST` | `/orders/:id/refund` | Initiates a Stripe refund for the captured PaymentIntent. |

All endpoints currently log requests and responses to the console to aid with EnsureBack integration testing.

## Webhook Testing

1. Start the server and expose it via a tunneling tool such as [Stripe CLI](https://stripe.com/docs/stripe-cli) or [ngrok](https://ngrok.com/).
2. Configure the Stripe webhook endpoint to point at `https://<your-tunnel>/webhook` and listen for `checkout.session.completed` events.
3. Confirm that webhook deliveries update the in-memory order store and log a message such as `Order <orderId> marked as paid`.

## Refund Testing

1. Trigger a successful payment to create an order in the `paid` state.
2. Call `POST /orders/:id/refund` to initiate a refund through Stripe.
3. Observe the order status transition to `refunded` and review the console logs for the order lifecycle.

## Notes

- The project keeps order data in memory only; restarting the server will clear all order history.
- These APIs intentionally omit authentication to simplify EnsureBack testing. Add appropriate auth before using in production.
- Replace the placeholder Stripe keys in `.env` with your own test keys before running checkout flows.
