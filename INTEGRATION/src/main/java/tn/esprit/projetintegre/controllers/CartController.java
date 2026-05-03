package tn.esprit.projetintegre.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.projetintegre.dto.ApiResponse;
import tn.esprit.projetintegre.dto.request.CheckoutRequest;
import tn.esprit.projetintegre.dto.response.CartResponse;
import tn.esprit.projetintegre.dto.response.CartSummary;
import tn.esprit.projetintegre.dto.response.OrderResponse;
import tn.esprit.projetintegre.entities.Cart;
import tn.esprit.projetintegre.entities.Order;
import tn.esprit.projetintegre.mapper.DtoMapper;
import tn.esprit.projetintegre.services.CartService;
import tn.esprit.projetintegre.services.StripeCheckoutService;

import java.util.Map;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@Tag(name = "Cart", description = "Shopping cart endpoints")
@SecurityRequirement(name = "Bearer Authentication")
public class CartController {

    private final CartService cartService;
    private final DtoMapper dtoMapper;
    private final StripeCheckoutService stripeCheckoutService;

    // ==================== GET ====================

    @GetMapping("/{userId}")
    @Operation(summary = "Get user's cart")
    public ResponseEntity<ApiResponse<CartResponse>> getCart(@PathVariable Long userId) {
        Cart cart = cartService.getCartByUserId(userId);
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toCartResponse(cart)));
    }

    @GetMapping("/{userId}/summary")
    @Operation(summary = "Get cart summary (item count, total)")
    public ResponseEntity<ApiResponse<CartSummary>> getCartSummary(@PathVariable Long userId) {
        CartSummary summary = cartService.getCartSummary(userId);
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    // ==================== POST ====================

    @PostMapping("/{userId}/items")
    @Operation(summary = "Add item to cart")
    public ResponseEntity<ApiResponse<CartResponse>> addItemToCart(
            @PathVariable Long userId,
            @RequestParam Long productId,
            @RequestParam(defaultValue = "1") Integer quantity) {
        try {
            Cart cart = cartService.addItemToCart(userId, productId, quantity);
            return ResponseEntity.ok(ApiResponse.success("Item added to cart", dtoMapper.toCartResponse(cart)));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{userId}/checkout")
    @Operation(summary = "Checkout and pay with wallet")
    public ResponseEntity<ApiResponse<OrderResponse>> checkout(
            @PathVariable Long userId,
            @RequestBody CheckoutRequest request) {
        try {
            Order order = cartService.checkout(userId, request);
            return ResponseEntity.ok(ApiResponse.success("Order placed successfully", dtoMapper.toOrderResponse(order)));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

//    @PostMapping("/{userId}/checkout/stripe-session")
//    @Operation(summary = "Create Stripe checkout session for cart payment")
//    public ResponseEntity<ApiResponse<Map<String, String>>> createStripeCheckoutSession(
//            @PathVariable Long userId,
//            @RequestBody CheckoutRequest request) {
//        var cart = cartService.getCartByUserId(userId);
//        var session = stripeCheckoutService.createCheckoutSession(userId, cart, request);
//        return ResponseEntity.ok(ApiResponse.success(Map.of(
//                "sessionId", session.sessionId(),
//                "checkoutUrl", session.checkoutUrl()
//        )));
//    }

//    @PostMapping("/{userId}/checkout/stripe-complete")
//    @Operation(summary = "Complete Stripe checkout and create order")
//    public ResponseEntity<ApiResponse<OrderResponse>> completeStripeCheckout(
//            @PathVariable Long userId,
//            @RequestParam String sessionId) {
//        try {
//            Order order = cartService.completeStripeCheckout(userId, sessionId);
//            return ResponseEntity.ok(ApiResponse.success("Stripe payment confirmed", dtoMapper.toOrderResponse(order)));
//        } catch (IllegalStateException e) {
//            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
//        }
//    }

    // ==================== PUT ====================

    @PutMapping("/{userId}/items/{itemId}")
    @Operation(summary = "Update cart item quantity")
    public ResponseEntity<ApiResponse<CartResponse>> updateCartItemQuantity(
            @PathVariable Long userId,
            @PathVariable Long itemId,
            @RequestParam Integer quantity) {
        try {
            Cart cart = cartService.updateCartItemQuantity(userId, itemId, quantity);
            return ResponseEntity.ok(ApiResponse.success("Cart updated", dtoMapper.toCartResponse(cart)));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ==================== DELETE ====================

    @DeleteMapping("/{userId}/items/{itemId}")
    @Operation(summary = "Remove item from cart")
    public ResponseEntity<ApiResponse<CartResponse>> removeItemFromCart(
            @PathVariable Long userId,
            @PathVariable Long itemId) {
        Cart cart = cartService.removeItemFromCart(userId, itemId);
        return ResponseEntity.ok(ApiResponse.success("Item removed from cart", dtoMapper.toCartResponse(cart)));
    }

    @DeleteMapping("/{userId}/clear")
    @Operation(summary = "Clear cart")
    public ResponseEntity<ApiResponse<CartResponse>> clearCart(@PathVariable Long userId) {
        Cart cart = cartService.clearCart(userId);
        return ResponseEntity.ok(ApiResponse.success("Cart cleared", dtoMapper.toCartResponse(cart)));
    }
    @PostMapping("/{userId}/apply-coupon")
    @Operation(summary = "Apply a coupon to cart")
    public ResponseEntity<ApiResponse<CartResponse>> applyCoupon(
            @PathVariable Long userId,
            @RequestParam String couponCode) {
        try {
            Cart cart = cartService.applyCoupon(userId, couponCode);
            return ResponseEntity.ok(ApiResponse.success("Coupon applied", dtoMapper.toCartResponse(cart)));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{userId}/remove-coupon")
    @Operation(summary = "Remove coupon from cart")
    public ResponseEntity<ApiResponse<CartResponse>> removeCoupon(@PathVariable Long userId) {
        Cart cart = cartService.removeCoupon(userId);
        return ResponseEntity.ok(ApiResponse.success("Coupon removed", dtoMapper.toCartResponse(cart)));
    }

// ==================== PROMOTION ENDPOINTS ====================

    @PostMapping("/{userId}/apply-best-promotion")
    @Operation(summary = "Apply best available promotion to cart")
    public ResponseEntity<ApiResponse<CartResponse>> applyBestPromotion(@PathVariable Long userId) {
        Cart cart = cartService.applyBestPromotion(userId);
        return ResponseEntity.ok(ApiResponse.success("Best promotion applied", dtoMapper.toCartResponse(cart)));
}}