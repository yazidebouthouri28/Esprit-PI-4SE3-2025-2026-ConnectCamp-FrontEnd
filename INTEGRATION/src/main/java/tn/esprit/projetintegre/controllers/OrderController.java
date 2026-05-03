package tn.esprit.projetintegre.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.projetintegre.dto.ApiResponse;
import tn.esprit.projetintegre.dto.PageResponse;
import tn.esprit.projetintegre.dto.request.OrderRequest;
import tn.esprit.projetintegre.dto.response.OrderResponse;
import tn.esprit.projetintegre.entities.Order;
import tn.esprit.projetintegre.enums.OrderStatus;
import tn.esprit.projetintegre.enums.PaymentStatus;
import tn.esprit.projetintegre.mapper.DtoMapper;
import tn.esprit.projetintegre.services.OrderService;

import java.math.BigDecimal;
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "Orders", description = "Order management endpoints")
@SecurityRequirement(name = "Bearer Authentication")
public class OrderController {

    private final OrderService orderService;
    private final DtoMapper dtoMapper;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all orders (Admin only), paginated")
    public ResponseEntity<ApiResponse<PageResponse<OrderResponse>>> getAllOrders(Pageable pageable) {
        Page<Order> orders = orderService.getAllOrders(pageable);
        Page<OrderResponse> response = orders.map(dtoMapper::toOrderResponse);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(response)));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get orders by user")
    public ResponseEntity<ApiResponse<PageResponse<OrderResponse>>> getOrdersByUser(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Order> orders = orderService.getOrdersByUser(userId, PageRequest.of(page, size));
        Page<OrderResponse> response = orders.map(dtoMapper::toOrderResponse);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(response)));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get orders by status (Admin only)")
    public ResponseEntity<ApiResponse<PageResponse<OrderResponse>>> getOrdersByStatus(
            @PathVariable OrderStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Order> orders = orderService.getOrdersByStatus(status, PageRequest.of(page, size));
        Page<OrderResponse> response = orders.map(dtoMapper::toOrderResponse);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(response)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get order by ID")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(@PathVariable Long id) {
        Order order = orderService.getOrderById(id);
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toOrderResponse(order)));
    }

    @GetMapping("/number/{orderNumber}")
    @Operation(summary = "Get order by number")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderByNumber(@PathVariable String orderNumber) {
        Order order = orderService.getOrderByNumber(orderNumber);
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toOrderResponse(order)));
    }

    @PostMapping
    @Operation(summary = "Create order from cart")
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            @RequestParam Long userId,
            @RequestParam String shippingName,
            @RequestParam String shippingPhone,
            @RequestParam String shippingAddress,
            @RequestParam String shippingCity,
            @RequestParam String shippingPostalCode,
            @RequestParam String shippingCountry,
            @RequestParam String paymentMethod,
            @RequestParam(required = false) String notes) {
        Order order = orderService.createOrderFromCart(userId, shippingName, shippingPhone,
                shippingAddress, shippingCity, shippingPostalCode, shippingCountry, paymentMethod, notes);
        return ResponseEntity.ok(ApiResponse.success("Order created successfully", dtoMapper.toOrderResponse(order)));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update order status (Admin only)")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam OrderStatus status) {
        Order order = orderService.updateOrderStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Order status updated", dtoMapper.toOrderResponse(order)));
    }

    @PatchMapping("/{id}/payment")
    @Operation(summary = "Update payment status")
    public ResponseEntity<ApiResponse<OrderResponse>> updatePaymentStatus(
            @PathVariable Long id,
            @RequestParam PaymentStatus status,
            @RequestParam(required = false) String transactionId) {
        Order order = orderService.updatePaymentStatus(id, status, transactionId);
        return ResponseEntity.ok(ApiResponse.success("Payment status updated", dtoMapper.toOrderResponse(order)));
    }

    @GetMapping("/revenue")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get total revenue (Admin only)")
    public ResponseEntity<ApiResponse<BigDecimal>> getTotalRevenue() {
        BigDecimal revenue = orderService.getTotalRevenue();
        return ResponseEntity.ok(ApiResponse.success(revenue));
    }
}
