package tn.esprit.projetintegre.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.projetintegre.dto.request.CheckoutRequest;
import tn.esprit.projetintegre.dto.FraudPrediction;
import tn.esprit.projetintegre.dto.response.CartSummary;
import tn.esprit.projetintegre.entities.*;
import tn.esprit.projetintegre.enums.OrderStatus;
import tn.esprit.projetintegre.enums.PaymentStatus;
import tn.esprit.projetintegre.enums.TransactionType;
import tn.esprit.projetintegre.exception.ResourceNotFoundException;
import tn.esprit.projetintegre.repositories.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class CartService {

    private static final BigDecimal FRAUD_SCREENING_THRESHOLD = new BigDecimal("3000");
    private static final BigDecimal FREE_SHIPPING_THRESHOLD = new BigDecimal("399");
    private static final BigDecimal DEFAULT_SHIPPING_COST = new BigDecimal("15.00");
    private static final BigDecimal REWARD_POINT_AMOUNT = new BigDecimal("10");

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final WalletService walletService;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    // ==================== NOUVELLES DÉPENDANCES ====================
    private final CouponService couponService;
    private final PromotionService promotionService;
    private final CouponUsageRepository couponUsageRepository;
    private final PromotionUsageRepository promotionUsageRepository;
    private final StripeCheckoutService stripeCheckoutService;
    private final UserRepository userRepository;
    private final FraudDetectionService fraudDetectionService;

    // ==================== GET ====================

    public Cart getCartByUserId(Long userId) {
        return cartRepository.findByUserId(userId)
                .orElseGet(() -> {
                    // Créer un nouveau panier si inexistant
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

                    Cart newCart = Cart.builder()
                            .user(user)
                            .totalAmount(BigDecimal.ZERO)
                            .discountAmount(BigDecimal.ZERO)
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();

                    return cartRepository.save(newCart);
                });
    }

    // ==================== ADD ITEM ====================

    @Transactional
    public Cart addItemToCart(Long userId, Long productId, Integer quantity) {
        // Vérifier la quantité
        if (quantity == null || quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than zero");
        }

        Cart cart = getCartByUserId(userId);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        // VÉRIFICATION STOCK
        if (product.getStockQuantity() < quantity) {
            throw new IllegalStateException("Insufficient stock. Available: " + product.getStockQuantity() + ", Requested: " + quantity);
        }

        Optional<CartItem> existingItem = cartItemRepository.findByCartIdAndProductId(cart.getId(), productId);

        if (existingItem.isPresent()) {
            CartItem item = existingItem.get();
            int newQuantity = item.getQuantity() + quantity;
            // Vérifier le stock total après ajout
            if (product.getStockQuantity() < newQuantity) {
                throw new IllegalStateException("Insufficient stock. Available: " + product.getStockQuantity() + ", Requested: " + newQuantity);
            }
            item.setQuantity(newQuantity);
            cartItemRepository.save(item);
        } else {
            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .quantity(quantity)
                    .price(product.getPrice())
                    .build();
            cart.getItems().add(newItem);
            cartItemRepository.save(newItem);
        }

        cart.calculateTotal();

        // Recalculer la meilleure promotion après modification du panier
        applyBestPromotion(userId);

        return cartRepository.save(cart);
    }

    // ==================== UPDATE QUANTITY ====================

    @Transactional
    public Cart updateCartItemQuantity(Long userId, Long itemId, Integer quantity) {
        if (quantity == null || quantity < 0) {
            throw new IllegalArgumentException("Quantity cannot be negative");
        }

        Cart cart = getCartByUserId(userId);
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found with id: " + itemId));

        // Vérifier que l'item appartient bien au panier de l'utilisateur
        if (!item.getCart().getId().equals(cart.getId())) {
            throw new IllegalStateException("Item does not belong to this cart");
        }

        if (quantity == 0) {
            // Supprimer l'item si quantité = 0
            cart.getItems().remove(item);
            cartItemRepository.delete(item);
        } else {
            // Vérifier le stock
            Product product = item.getProduct();
            if (product.getStockQuantity() < quantity) {
                throw new IllegalStateException("Insufficient stock. Available: " + product.getStockQuantity());
            }
            item.setQuantity(quantity);
            cartItemRepository.save(item);
        }

        cart.calculateTotal();

        // Recalculer la meilleure promotion après modification du panier
        applyBestPromotion(userId);

        return cartRepository.save(cart);
    }

    // ==================== REMOVE ITEM ====================

    @Transactional
    public Cart removeItemFromCart(Long userId, Long itemId) {
        Cart cart = getCartByUserId(userId);
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found with id: " + itemId));

        // Vérifier que l'item appartient bien au panier de l'utilisateur
        if (!item.getCart().getId().equals(cart.getId())) {
            throw new IllegalStateException("Item does not belong to this cart");
        }

        cart.getItems().remove(item);
        cartItemRepository.delete(item);

        cart.calculateTotal();

        // Recalculer la meilleure promotion après modification du panier
        applyBestPromotion(userId);

        return cartRepository.save(cart);
    }

    // ==================== CLEAR CART ====================

    @Transactional
    public Cart clearCart(Long userId) {
        Cart cart = getCartByUserId(userId);
        cart.getItems().clear();
        cartItemRepository.deleteByCartId(cart.getId());
        cart.setTotalAmount(BigDecimal.ZERO);
        cart.setDiscountAmount(BigDecimal.ZERO);
        cart.setAppliedCouponCode(null);
        cart.setAppliedPromotionId(null);
        cart.setAppliedPromotionName(null);
        return cartRepository.save(cart);
    }

    // ==================== GET CART SUMMARY ====================

    public CartSummary getCartSummary(Long userId) {
        Cart cart = getCartByUserId(userId);

        int itemCount = cart.getItems().stream()
                .mapToInt(CartItem::getQuantity)
                .sum();

        BigDecimal discountAmount = cart.getDiscountAmount() != null ? cart.getDiscountAmount() : BigDecimal.ZERO;

        return CartSummary.builder()
                .itemCount(itemCount)
                .subtotal(cart.getTotalAmount())
                .discountAmount(discountAmount)
                .total(cart.getTotalAmount().subtract(discountAmount))
                .build();
    }

    // ==================== COUPON METHODS ====================

    @Transactional
    public Cart applyCoupon(Long userId, String couponCode) {
        Cart cart = getCartByUserId(userId);

        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new IllegalStateException("Cart is empty. Cannot apply coupon.");
        }

        // Vérifier et calculer la réduction
        BigDecimal discount = couponService.calculateDiscount(couponCode, cart.getTotalAmount());

        // Appliquer la réduction
        cart.setDiscountAmount(discount);
        cart.setAppliedCouponCode(couponCode.toUpperCase());

        // Enlever la promotion automatique si un coupon est appliqué manuellement
        cart.setAppliedPromotionId(null);
        cart.setAppliedPromotionName(null);

        return cartRepository.save(cart);
    }

    @Transactional
    public Cart removeCoupon(Long userId) {
        Cart cart = getCartByUserId(userId);
        cart.setDiscountAmount(BigDecimal.ZERO);
        cart.setAppliedCouponCode(null);

        // Réappliquer la meilleure promotion automatique
        applyBestPromotion(userId);

        return cartRepository.save(cart);
    }

    // ==================== PROMOTION METHODS ====================

    @Transactional
    public Cart applyBestPromotion(Long userId) {
        Cart cart = getCartByUserId(userId);

        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            return cart;
        }

        // Si un coupon manuel est déjà appliqué, ne pas écraser
        if (cart.getAppliedCouponCode() != null) {
            return cart;
        }

        List<Promotion> validPromotions = promotionService.getValidPromotions();
        BigDecimal bestDiscount = BigDecimal.ZERO;
        Promotion bestPromotion = null;

        for (Promotion promotion : validPromotions) {
            BigDecimal discount = calculatePromotionDiscount(promotion, cart);
            if (discount.compareTo(bestDiscount) > 0) {
                bestDiscount = discount;
                bestPromotion = promotion;
            }
        }

        if (bestPromotion != null && bestDiscount.compareTo(BigDecimal.ZERO) > 0) {
            cart.setDiscountAmount(bestDiscount);
            cart.setAppliedPromotionId(bestPromotion.getId());
            cart.setAppliedPromotionName(bestPromotion.getName());
        } else {
            cart.setDiscountAmount(BigDecimal.ZERO);
            cart.setAppliedPromotionId(null);
            cart.setAppliedPromotionName(null);
        }

        return cartRepository.save(cart);
    }

    private BigDecimal calculatePromotionDiscount(Promotion promotion, Cart cart) {
        // Vérifier si la promotion est valide
        if (!promotion.isValid()) {
            return BigDecimal.ZERO;
        }

        // Vérifier le montant minimum
        if (promotion.getMinPurchaseAmount() != null &&
                cart.getTotalAmount().compareTo(promotion.getMinPurchaseAmount()) < 0) {
            return BigDecimal.ZERO;
        }



        // Calculer la réduction
        BigDecimal discount = BigDecimal.ZERO;
        switch (promotion.getType()) {
            case PERCENTAGE:
                discount = cart.getTotalAmount()
                        .multiply(promotion.getDiscountValue())
                        .divide(BigDecimal.valueOf(100));
                break;
            case FIXED_AMOUNT:
                discount = promotion.getDiscountValue();
                break;
            default:
                return BigDecimal.ZERO;
        }

        // Appliquer la réduction maximale
        if (promotion.getMaxDiscountAmount() != null &&
                discount.compareTo(promotion.getMaxDiscountAmount()) > 0) {
            discount = promotion.getMaxDiscountAmount();
        }

        return discount;
    }





    // ==================== CHECKOUT (PAIEMENT AVEC WALLET) ====================

    @Transactional
    public Order checkout(Long userId, CheckoutRequest request) {
        return finalizeCheckout(userId, request, "WALLET", null, true);
    }

    @Transactional
    public Order completeStripeCheckout(Long userId, String sessionId) {
        Optional<Order> existingOrder = orderRepository.findByPaymentTransactionId(sessionId);
        if (existingOrder.isPresent()) {
            return existingOrder.get();
        }

        StripeCheckoutService.StripePaidSession paidSession = stripeCheckoutService.getPaidSession(sessionId);
        if (!String.valueOf(userId).equals(paidSession.userId())) {
            throw new IllegalStateException("Stripe session does not belong to this user.");
        }

        CheckoutRequest request = CheckoutRequest.builder()
                .shippingAddress(paidSession.shippingAddress())
                .shippingCity(paidSession.shippingCity())
                .shippingCountry(paidSession.shippingCountry())
                .shippingPhone(paidSession.shippingPhone())
                .notes(paidSession.notes())
                .shippingCost(parseShippingCost(paidSession.shippingCost()))
                .build();

        return finalizeCheckout(userId, request, "CARD", sessionId, false);
    }

    private Order finalizeCheckout(Long userId, CheckoutRequest request, String paymentMethod, String paymentTransactionId, boolean deductFromWallet) {
        // 1. Récupérer le panier
        Cart cart = getCartByUserId(userId);

        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new IllegalStateException("Cart is empty. Cannot checkout.");
        }

        // 2. Vérifier le stock pour tous les articles
        for (CartItem item : cart.getItems()) {
            Product product = item.getProduct();
            if (product.getStockQuantity() < item.getQuantity()) {
                throw new IllegalStateException("Insufficient stock for product: " + product.getName() +
                        ". Available: " + product.getStockQuantity() + ", Requested: " + item.getQuantity());
            }
        }

        // 3. Calculer le total final
        BigDecimal totalAmount = cart.getTotalAmount();
        BigDecimal discountAmount = cart.getDiscountAmount() != null ? cart.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal amountAfterDiscount = totalAmount.subtract(discountAmount);
        BigDecimal shippingCost = calculateShippingCost(amountAfterDiscount, request.getShippingCost());
        BigDecimal finalAmount = amountAfterDiscount.add(shippingCost);

        if (finalAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalStateException("Total amount must be greater than zero");
        }

        blockHighRiskCheckout(cart, finalAmount);

        // 4. Débiter le wallet uniquement pour paiement wallet
        if (deductFromWallet) {
            try {
                walletService.deductFunds(userId, finalAmount, TransactionType.PURCHASE, "Order payment");
            } catch (IllegalStateException e) {
                throw new IllegalStateException("Payment failed: " + e.getMessage());
            }
        }

        // 5. Créer la commande
        Order order = Order.builder()
                .orderNumber(generateOrderNumber())
                .user(cart.getUser())
                .totalAmount(finalAmount)
                .subtotal(totalAmount)
                .discountAmount(discountAmount)
                .taxAmount(calculateTax(finalAmount))
                .shippingCost(shippingCost)
                .status(OrderStatus.PENDING)
                .paymentStatus(PaymentStatus.COMPLETED)
                .paymentMethod(paymentMethod)
                .paymentTransactionId(paymentTransactionId)
                .shippingAddress(request.getShippingAddress())
                .shippingCity(request.getShippingCity())
                .shippingCountry(request.getShippingCountry())
                .shippingPhone(request.getShippingPhone())
                .notes(request.getNotes())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        order = orderRepository.save(order);

        // 6. Créer les lignes de commande et mettre à jour les stocks
        for (CartItem cartItem : cart.getItems()) {
            Product product = cartItem.getProduct();

            // Créer la ligne de commande
            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .quantity(cartItem.getQuantity())
                    .unitPrice(product.getPrice())
                    .totalPrice(product.getPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity())))
                    .build();
            orderItemRepository.save(orderItem);

            // Mettre à jour le stock
            product.setStockQuantity(product.getStockQuantity() - cartItem.getQuantity());
            productRepository.save(product);
        }

        // 7. Enregistrer l'utilisation du coupon si un code a été appliqué
        if (cart.getAppliedCouponCode() != null && discountAmount.compareTo(BigDecimal.ZERO) > 0) {
            Coupon coupon = couponService.getCouponByCode(cart.getAppliedCouponCode());

            CouponUsage couponUsage = CouponUsage.builder()
                    .coupon(coupon)
                    .user(cart.getUser())
                    .order(order)
                    .usedAt(LocalDateTime.now())
                    .discountAmount(discountAmount)
                    .orderAmount(finalAmount)
                    .build();

            couponUsageRepository.save(couponUsage);
            couponService.useCoupon(cart.getAppliedCouponCode());
        }

        // 8. Enregistrer l'utilisation de la promotion automatique
        if (cart.getAppliedPromotionId() != null && discountAmount.compareTo(BigDecimal.ZERO) > 0) {
            Promotion promotion = promotionService.getPromotionById(cart.getAppliedPromotionId());

            PromotionUsage promotionUsage = PromotionUsage.builder()
                    .promotion(promotion)
                    .user(cart.getUser())
                    .order(order)
                    .usedAt(LocalDateTime.now())
                    .discountAmount(discountAmount)
                    .originalAmount(totalAmount)
                    .finalAmount(finalAmount)
                    .build();

            promotionUsageRepository.save(promotionUsage);
            promotionService.incrementUsage(promotion.getId());
        }

        int earnedPoints = calculateRewardPoints(totalAmount.subtract(discountAmount));
        if (earnedPoints > 0) {
            User user = cart.getUser();
            user.setLoyaltyPoints((user.getLoyaltyPoints() == null ? 0 : user.getLoyaltyPoints()) + earnedPoints);
            userRepository.save(user);
        }

        // 9. Vider le panier
        clearCart(userId);

        return order;
    }

    private void blockHighRiskCheckout(Cart cart, BigDecimal finalAmount) {
        if (finalAmount == null || finalAmount.compareTo(FRAUD_SCREENING_THRESHOLD) < 0) {
            return;
        }

        int hour = LocalDateTime.now().getHour();
        String userProfile = mapToMlProfile(cart.getUser());
        String timezone = "Africa/Tunis";

        FraudPrediction prediction = fraudDetectionService.predictFraud(
                finalAmount.doubleValue(),
                hour,
                "SHOPPING",
                userProfile,
                0,
                timezone
        );

        if (prediction == null || !prediction.isSuccess()) {
            throw new IllegalStateException("Order blocked for security review.");
        }

        boolean highRisk = prediction.isFraud()
                || prediction.getFraudProbability() >= 0.7
                || "HIGH".equalsIgnoreCase(prediction.getRiskLevel());

        if (highRisk) {
            throw new IllegalStateException("Order blocked for security review.");
        }
    }

    private String mapToMlProfile(User user) {
        if (user == null || user.getRole() == null) {
            return "NORMAL";
        }
        return switch (user.getRole().name().toUpperCase()) {
            case "PREMIUM", "ADMIN" -> "PREMIUM";
            case "ECONOMICAL" -> "ECONOMICAL";
            default -> "NORMAL";
        };
    }

    private BigDecimal parseShippingCost(String shippingCost) {
        try {
            return new BigDecimal(shippingCost);
        } catch (Exception e) {
            return DEFAULT_SHIPPING_COST;
        }
    }

    private BigDecimal calculateShippingCost(BigDecimal amountAfterDiscount, BigDecimal requestedShippingCost) {
        if (amountAfterDiscount.compareTo(FREE_SHIPPING_THRESHOLD) >= 0) {
            return BigDecimal.ZERO;
        }
        return requestedShippingCost != null ? requestedShippingCost : DEFAULT_SHIPPING_COST;
    }

    private int calculateRewardPoints(BigDecimal rewardBaseAmount) {
        if (rewardBaseAmount == null || rewardBaseAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return 0;
        }
        return rewardBaseAmount.divideToIntegralValue(REWARD_POINT_AMOUNT).intValue();
    }

    // ==================== UTILS ====================

    private String generateOrderNumber() {
        return "ORD-" + System.currentTimeMillis() + "-" +
                UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private BigDecimal calculateTax(BigDecimal amount) {
        // TVA 20%
        return amount.multiply(new BigDecimal("0.20"));
    }
}
