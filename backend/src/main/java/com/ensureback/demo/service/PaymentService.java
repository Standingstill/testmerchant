package com.ensureback.demo.service;

import com.ensureback.demo.dto.PaymentIntentResponse;
import com.ensureback.demo.model.Order;
import com.ensureback.demo.model.OrderStatus;
import com.ensureback.demo.repository.OrderRepository;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    private static final String PRODUCT_NAME = "Premium Wireless Headphones";
    private static final int PRODUCT_AMOUNT = 9999;
    private static final String CURRENCY = "usd";

    private final OrderRepository orderRepository;

    public PaymentService(OrderRepository orderRepository, @Value("${stripe.api.key}") String apiKey) {
        this.orderRepository = orderRepository;
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("Stripe secret key must be configured (STRIPE_SECRET_KEY)");
        }
        Stripe.apiKey = apiKey;
    }

    public PaymentIntentResponse createPaymentIntent() throws StripeException {
        UUID orderId = UUID.randomUUID();
        String orderIdValue = orderId.toString();

        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount((long) PRODUCT_AMOUNT)
                .setCurrency(CURRENCY)
                .setCaptureMethod(PaymentIntentCreateParams.CaptureMethod.AUTOMATIC)
                .setDescription(PRODUCT_NAME)
                .putMetadata("orderId", orderIdValue)
                .putMetadata("productName", PRODUCT_NAME)
                .putMetadata("amount", String.valueOf(PRODUCT_AMOUNT))
                .setAutomaticPaymentMethods(
                        PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                .setEnabled(true)
                                .build()
                )
                .build();

        PaymentIntent paymentIntent = PaymentIntent.create(params);
        log.info("Created Stripe PaymentIntent {} for order {}", paymentIntent.getId(), orderIdValue);

        Order order = new Order(orderId, PRODUCT_NAME, PRODUCT_AMOUNT, paymentIntent.getId(), OrderStatus.PENDING, Instant.now());
        orderRepository.save(order);

        return new PaymentIntentResponse(paymentIntent.getClientSecret(), orderIdValue, paymentIntent.getId());
    }
}
