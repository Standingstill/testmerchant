package com.ensureback.demo.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record OrderRecordRequest(
        @NotBlank String orderId,
        @NotBlank String paymentIntentId,
        @NotBlank String productName,
        @NotNull @Min(1) Integer amount,
        @NotBlank String status
) {
}
