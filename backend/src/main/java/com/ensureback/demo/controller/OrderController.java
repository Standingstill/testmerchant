package com.ensureback.demo.controller;

import com.ensureback.demo.dto.OrderRecordRequest;
import com.ensureback.demo.model.Order;
import com.ensureback.demo.model.OrderStatus;
import com.ensureback.demo.repository.OrderRepository;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private static final Logger log = LoggerFactory.getLogger(OrderController.class);

    private final OrderRepository orderRepository;

    public OrderController(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @GetMapping
    public List<Order> getOrders() {
        return orderRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<Order> recordOrder(@Valid @RequestBody OrderRecordRequest request) {
        UUID orderId = UUID.fromString(request.orderId());
        OrderStatus status = OrderStatus.valueOf(request.status().toUpperCase());

        Order order = orderRepository.findById(orderId)
                .orElseGet(() -> new Order(orderId,
                        request.productName(),
                        request.amount(),
                        request.paymentIntentId(),
                        status,
                        Instant.now()));

        order.setProductName(request.productName());
        order.setAmount(request.amount());
        order.setStripePaymentIntentId(request.paymentIntentId());
        order.setStatus(status);
        if (order.getCreatedAt() == null) {
            order.setCreatedAt(Instant.now());
        }

        Order saved = orderRepository.save(order);
        log.info("Recorded order {} with status {} (payment intent: {})", saved.getId(), saved.getStatus(), saved.getStripePaymentIntentId());
        return ResponseEntity.ok(saved);
    }
}
