package com.ensureback.demo.controller;

import com.ensureback.demo.dto.PaymentIntentResponse;
import com.ensureback.demo.service.CheckoutService;
import com.stripe.exception.StripeException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final CheckoutService checkoutService;

    public PaymentController(CheckoutService checkoutService) {
        this.checkoutService = checkoutService;
    }

    @PostMapping("/create-intent")
    public ResponseEntity<PaymentIntentResponse> createPaymentIntent() throws StripeException {
        return ResponseEntity.ok(checkoutService.createPaymentIntent());
    }
}
