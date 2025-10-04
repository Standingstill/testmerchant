package com.ensureback.demo.dto;

public class CheckoutSessionResponse {
    private String sessionId;
    private String url;
    private String orderId;

    public CheckoutSessionResponse(String sessionId, String url, String orderId) {
        this.sessionId = sessionId;
        this.url = url;
        this.orderId = orderId;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }
}
