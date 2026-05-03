package tn.esprit.projetintegre.services;


import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.projetintegre.entities.*;
import tn.esprit.projetintegre.enums.OrderStatus;
import tn.esprit.projetintegre.enums.PaymentStatus;
import tn.esprit.projetintegre.enums.TransactionStatus;
import tn.esprit.projetintegre.enums.TransactionType;
import tn.esprit.projetintegre.exception.ResourceNotFoundException;
import tn.esprit.projetintegre.repositories.OrderRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentService {

    private final OrderRepository orderRepository;
    private final WalletService walletService;
    private final TransactionService transactionService;

    /**
     * Pay an order using wallet balance
     */
    public void payOrder(Long orderId, Long userId) {

        // =========================
        // 1. GET ORDER
        // =========================
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        if (order.getPaymentStatus() == PaymentStatus.COMPLETED) {
            throw new IllegalStateException("Order already paid");
        }

        // =========================
        // 2. GET WALLET
        // =========================
        Wallet wallet = walletService.getWalletByUserId(userId);

        if (!wallet.getIsActive()) {
            throw new IllegalStateException("Wallet is deactivated");
        }

        BigDecimal balanceBefore = wallet.getBalance() != null
                ? wallet.getBalance()
                : BigDecimal.ZERO;

        BigDecimal amount = order.getTotalAmount();

        // =========================
        // 3. CHECK BALANCE
        // =========================
        if (balanceBefore.compareTo(amount) < 0) {
            throw new IllegalStateException(
                    "Insufficient balance. Available: " + balanceBefore + ", Required: " + amount
            );
        }

        // =========================
        // 4. UPDATE WALLET
        // =========================
        BigDecimal balanceAfter = balanceBefore.subtract(amount);
        wallet.setBalance(balanceAfter);
        wallet.setUpdatedAt(LocalDateTime.now());

        walletService.saveWallet(wallet); // ou walletRepository.save(wallet)

        // =========================
        // 5. CREATE TRANSACTION
        // =========================
        Transaction transaction = Transaction.builder()
                .transactionNumber(generateTransactionNumber())
                .user(wallet.getUser())
                .wallet(wallet)
                .type(TransactionType.WITHDRAWAL) // payment = money out
                .amount(amount)
                .balanceBefore(balanceBefore)
                .balanceAfter(balanceAfter)
                .status(TransactionStatus.COMPLETED)
                .paymentMethod("WALLET")
                .description("Payment for order #" + order.getOrderNumber())
                .createdAt(LocalDateTime.now())
                .processedAt(LocalDateTime.now())
                .build();

        transactionService.saveTransaction(transaction);

        // =========================
        // 6. UPDATE ORDER
        // =========================
        order.setPaymentStatus(PaymentStatus.COMPLETED);
        order.setStatus(OrderStatus.CONFIRMED);
        order.setPaidAt(LocalDateTime.now());
        order.setPaymentTransactionId(transaction.getTransactionNumber());

        orderRepository.save(order);
    }

    /**
     * Generate transaction number
     */
    private String generateTransactionNumber() {
        return "PAY-" + System.currentTimeMillis();
    }
}