package com.ensureback.demo.dto;

public record PaymentIntentResponse(String clientSecret, String orderId) {
}
