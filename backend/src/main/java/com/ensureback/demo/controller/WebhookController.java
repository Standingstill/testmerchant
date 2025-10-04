package com.ensureback.demo.controller;

import com.ensureback.demo.model.Order;
import com.ensureback.demo.model.OrderStatus;
import com.ensureback.demo.repository.OrderRepository;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
public class WebhookController {

    private static final Logger log = LoggerFactory.getLogger(WebhookController.class);

    private final OrderRepository orderRepository;
    private final String webhookSecret;

    public WebhookController(OrderRepository orderRepository,
                             @Value("${stripe.webhook.secret}") String webhookSecret) {
        this.orderRepository = orderRepository;
        if (webhookSecret == null || webhookSecret.isBlank()) {
            throw new IllegalStateException("Stripe webhook secret must be configured (STRIPE_WEBHOOK_SECRET)");
        }
        this.webhookSecret = webhookSecret;
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(@RequestBody String payload,
                                                @RequestHeader("Stripe-Signature") String signature) throws SignatureVerificationException {
        Event event = Webhook.constructEvent(payload, signature, webhookSecret);
        log.info("Received Stripe webhook event: {}", event.getType());

        switch (event.getType()) {
            case "payment_intent.succeeded" -> handlePaymentSucceeded(event);
            case "payment_intent.payment_failed" -> handlePaymentFailed(event);
            default -> log.debug("Unhandled event type: {}", event.getType());
        }

        return ResponseEntity.ok("received");
    }

    private void handlePaymentSucceeded(Event event) {
        EventDataObjectDeserializer dataObjectDeserializer = event.getDataObjectDeserializer();
        Optional<Object> dataObject = dataObjectDeserializer.getObject().map(Object.class::cast);
        if (dataObject.isEmpty()) {
            log.warn("Unable to deserialize payment_intent.succeeded event payload");
            return;
        }

        PaymentIntent paymentIntent = (PaymentIntent) dataObject.get();
        Map<String, String> metadata = paymentIntent.getMetadata();
        String orderIdValue = metadata.get("orderId");
        if (orderIdValue == null) {
            log.warn("payment_intent.succeeded missing orderId metadata");
            return;
        }

        UUID orderId = UUID.fromString(orderIdValue);
        Order order = orderRepository.findById(orderId)
                .orElseGet(() -> new Order(orderId,
                        metadata.getOrDefault("productName", "Premium Wireless Headphones"),
                        Integer.parseInt(metadata.getOrDefault("amount", "0")),
                        paymentIntent.getId(),
                        OrderStatus.PENDING,
                        Instant.now()));

        order.setStatus(OrderStatus.PAID);
        order.setStripePaymentIntentId(paymentIntent.getId());
        if (paymentIntent.getAmountReceived() != null) {
            order.setAmount(paymentIntent.getAmountReceived().intValue());
        } else if (paymentIntent.getAmount() != null) {
            order.setAmount(paymentIntent.getAmount().intValue());
        }
        orderRepository.save(order);
        log.info("Order {} marked as PAID via webhook (payment intent: {})", order.getId(), order.getStripePaymentIntentId());
    }

    private void handlePaymentFailed(Event event) {
        EventDataObjectDeserializer dataObjectDeserializer = event.getDataObjectDeserializer();
        Optional<Object> dataObject = dataObjectDeserializer.getObject().map(Object.class::cast);
        if (dataObject.isEmpty()) {
            log.warn("Unable to deserialize payment_intent.payment_failed event payload");
            return;
        }

        PaymentIntent paymentIntent = (PaymentIntent) dataObject.get();
        Map<String, String> metadata = paymentIntent.getMetadata();
        String orderIdValue = metadata.get("orderId");
        if (orderIdValue == null) {
            log.warn("payment_intent.payment_failed missing orderId metadata");
            return;
        }

        UUID orderId = UUID.fromString(orderIdValue);
        Order order = orderRepository.findById(orderId)
                .orElseGet(() -> new Order(orderId,
                        metadata.getOrDefault("productName", "Premium Wireless Headphones"),
                        Integer.parseInt(metadata.getOrDefault("amount", "0")),
                        paymentIntent.getId(),
                        OrderStatus.PENDING,
                        Instant.now()));

        order.setStatus(OrderStatus.FAILED);
        order.setStripePaymentIntentId(paymentIntent.getId());
        orderRepository.save(order);
        log.info("Order {} marked as FAILED", order.getId());
    }
}
