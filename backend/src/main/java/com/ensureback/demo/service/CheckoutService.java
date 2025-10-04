package com.ensureback.demo.service;

import com.ensureback.demo.dto.CheckoutSessionResponse;
import com.ensureback.demo.model.Order;
import com.ensureback.demo.model.OrderStatus;
import com.ensureback.demo.repository.OrderRepository;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
public class CheckoutService {

    private static final Logger log = LoggerFactory.getLogger(CheckoutService.class);

    private static final String PRODUCT_NAME = "Premium Wireless Headphones";
    private static final int PRODUCT_AMOUNT = 9999;
    private static final String CURRENCY = "usd";

    private final OrderRepository orderRepository;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    public CheckoutService(OrderRepository orderRepository, @Value("${stripe.api.key}") String apiKey) {
        this.orderRepository = orderRepository;
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("Stripe secret key must be configured (STRIPE_SECRET_KEY)");
        }
        Stripe.apiKey = apiKey;
    }

    public CheckoutSessionResponse createCheckoutSession() throws StripeException {
        UUID orderId = UUID.randomUUID();
        String orderIdValue = orderId.toString();

        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(frontendUrl + "/success?session_id={CHECKOUT_SESSION_ID}&orderId=" + orderIdValue)
                .setCancelUrl(frontendUrl + "/cancel?orderId=" + orderIdValue)
                .putMetadata("orderId", orderIdValue)
                .putMetadata("productName", PRODUCT_NAME)
                .putMetadata("amount", String.valueOf(PRODUCT_AMOUNT))
                .addLineItem(SessionCreateParams.LineItem.builder()
                        .setQuantity(1L)
                        .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                                .setCurrency(CURRENCY)
                                .setUnitAmount((long) PRODUCT_AMOUNT)
                                .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                        .setName(PRODUCT_NAME)
                                        .setDescription("Experience crisp audio with noise cancellation and 20-hour battery life.")
                                        .build())
                                .build())
                        .build())
                .setPaymentIntentData(SessionCreateParams.PaymentIntentData.builder()
                        .putMetadata("orderId", orderIdValue)
                        .putMetadata("productName", PRODUCT_NAME)
                        .putMetadata("amount", String.valueOf(PRODUCT_AMOUNT))
                        .build())
                .build();

        Session session = Session.create(params);
        log.info("Created Stripe Checkout session {} for order {}", session.getId(), orderIdValue);

        Order order = new Order(orderId, PRODUCT_NAME, PRODUCT_AMOUNT, null, OrderStatus.PENDING, Instant.now());
        orderRepository.save(order);

        return new CheckoutSessionResponse(session.getId(), session.getUrl(), orderIdValue);
    }
}
