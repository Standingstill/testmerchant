package com.ensureback.demo.controller;

import com.ensureback.demo.dto.CheckoutSessionResponse;
import com.ensureback.demo.service.CheckoutService;
import com.stripe.exception.StripeException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/checkout")
public class CheckoutController {

    private final CheckoutService checkoutService;

    public CheckoutController(CheckoutService checkoutService) {
        this.checkoutService = checkoutService;
    }

    @PostMapping("/create-session")
    public ResponseEntity<CheckoutSessionResponse> createCheckoutSession() throws StripeException {
        return ResponseEntity.ok(checkoutService.createCheckoutSession());
    }
}
