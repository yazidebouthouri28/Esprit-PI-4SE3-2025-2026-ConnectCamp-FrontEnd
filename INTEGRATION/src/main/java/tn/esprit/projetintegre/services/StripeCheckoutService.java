package tn.esprit.projetintegre.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import tn.esprit.projetintegre.dto.request.CheckoutRequest;
import tn.esprit.projetintegre.entities.Cart;
import tn.esprit.projetintegre.entities.CartItem;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Service
public class StripeCheckoutService {

    private static final String STRIPE_SESSIONS_URL = "https://api.stripe.com/v1/checkout/sessions";

    private final ObjectMapper objectMapper;

    @Value("${stripe.secret-key:}")
    private String stripeSecretKey;

    @Value("${stripe.checkout.success-url:http://localhost:4200/dashboard?tab=orders&stripe=success}")
    private String successUrl;

    @Value("${stripe.checkout.cancel-url:http://localhost:4200/dashboard?tab=cart&stripe=cancel}")
    private String cancelUrl;

    public StripeCheckoutService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public StripeSessionResponse createCheckoutSession(Long userId, Cart cart, CheckoutRequest request) {
        if (stripeSecretKey == null || stripeSecretKey.isBlank()) {
            throw new IllegalStateException("Stripe secret key is missing. Set stripe.secret-key in configuration.");
        }
        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new IllegalStateException("Cart is empty. Cannot start Stripe checkout.");
        }

        try {
            String payload = buildStripeFormPayload(userId, cart, request);
            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(STRIPE_SESSIONS_URL))
                    .header("Authorization", "Bearer " + stripeSecretKey)
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();

            HttpResponse<String> response = HttpClient.newHttpClient()
                    .send(httpRequest, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("Stripe session creation failed: " + response.body());
            }

            JsonNode jsonNode = objectMapper.readTree(response.body());
            return new StripeSessionResponse(jsonNode.path("id").asText(), jsonNode.path("url").asText());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Failed to create Stripe session: " + e.getMessage(), e);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to create Stripe session: " + e.getMessage(), e);
        }
    }

    public StripePaidSession getPaidSession(String sessionId) {
        if (stripeSecretKey == null || stripeSecretKey.isBlank()) {
            throw new IllegalStateException("Stripe secret key is missing. Set stripe.secret-key in configuration.");
        }

        try {
            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(STRIPE_SESSIONS_URL + "/" + sessionId))
                    .header("Authorization", "Bearer " + stripeSecretKey)
                    .GET()
                    .build();

            HttpResponse<String> response = HttpClient.newHttpClient()
                    .send(httpRequest, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("Stripe session fetch failed: " + response.body());
            }

            JsonNode jsonNode = objectMapper.readTree(response.body());
            String paymentStatus = jsonNode.path("payment_status").asText("");
            String status = jsonNode.path("status").asText("");
            if (!"paid".equalsIgnoreCase(paymentStatus) || !"complete".equalsIgnoreCase(status)) {
                throw new IllegalStateException("Stripe payment is not completed yet.");
            }

            JsonNode metadata = jsonNode.path("metadata");
            return new StripePaidSession(
                    jsonNode.path("id").asText(""),
                    metadata.path("userId").asText(""),
                    metadata.path("shippingAddress").asText(""),
                    metadata.path("shippingCity").asText(""),
                    metadata.path("shippingCountry").asText(""),
                    metadata.path("shippingPhone").asText(""),
                    metadata.path("notes").asText(""),
                    metadata.path("shippingCost").asText("0")
            );
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Failed to verify Stripe session: " + e.getMessage(), e);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to verify Stripe session: " + e.getMessage(), e);
        }
    }

    private String buildStripeFormPayload(Long userId, Cart cart, CheckoutRequest request) {
        List<String> params = new ArrayList<>();
        params.add(form("mode", "payment"));
        params.add(form("success_url", resolvedSuccessUrl()));
        params.add(form("cancel_url", cancelUrl));
        params.add(form("metadata[userId]", String.valueOf(userId)));
        params.add(form("metadata[shippingAddress]", defaultValue(request.getShippingAddress())));
        params.add(form("metadata[shippingCity]", defaultValue(request.getShippingCity())));
        params.add(form("metadata[shippingCountry]", defaultValue(request.getShippingCountry())));
        params.add(form("metadata[shippingPhone]", defaultValue(request.getShippingPhone())));
        params.add(form("metadata[notes]", defaultValue(request.getNotes())));
        params.add(form("metadata[shippingCost]", String.valueOf(request.getShippingCost() == null ? BigDecimal.ZERO : request.getShippingCost())));

        int itemIndex = 0;
        for (CartItem item : cart.getItems()) {
            long unitAmount = item.getPrice().multiply(BigDecimal.valueOf(100)).longValue();
            params.add(form("line_items[" + itemIndex + "][price_data][currency]", "usd"));
            params.add(form("line_items[" + itemIndex + "][price_data][unit_amount]", String.valueOf(unitAmount)));
            params.add(form("line_items[" + itemIndex + "][price_data][product_data][name]", item.getProduct().getName()));
            params.add(form("line_items[" + itemIndex + "][quantity]", String.valueOf(item.getQuantity())));
            itemIndex++;
        }

        BigDecimal shippingCost = request.getShippingCost() != null ? request.getShippingCost() : BigDecimal.ZERO;
        if (shippingCost.compareTo(BigDecimal.ZERO) > 0) {
            params.add(form("line_items[" + itemIndex + "][price_data][currency]", "usd"));
            params.add(form("line_items[" + itemIndex + "][price_data][unit_amount]", String.valueOf(shippingCost.multiply(BigDecimal.valueOf(100)).longValue())));
            params.add(form("line_items[" + itemIndex + "][price_data][product_data][name]", "Shipping"));
            params.add(form("line_items[" + itemIndex + "][quantity]", "1"));
        }

        return String.join("&", params);
    }

    private String form(String key, String value) {
        return URLEncoder.encode(key, StandardCharsets.UTF_8) + "=" +
                URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private String defaultValue(String value) {
        return value == null ? "" : value;
    }

    private String resolvedSuccessUrl() {
        if (successUrl.contains("{CHECKOUT_SESSION_ID}")) {
            return successUrl;
        }
        String separator = successUrl.contains("?") ? "&" : "?";
        return successUrl + separator + "session_id={CHECKOUT_SESSION_ID}";
    }

    public record StripeSessionResponse(String sessionId, String checkoutUrl) {}
    public record StripePaidSession(
            String sessionId,
            String userId,
            String shippingAddress,
            String shippingCity,
            String shippingCountry,
            String shippingPhone,
            String notes,
            String shippingCost
    ) {}
}
