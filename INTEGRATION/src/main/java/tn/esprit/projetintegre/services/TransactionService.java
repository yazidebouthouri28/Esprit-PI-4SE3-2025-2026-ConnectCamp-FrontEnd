package tn.esprit.projetintegre.services;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.projetintegre.dto.FraudPrediction;
import tn.esprit.projetintegre.entities.Transaction;
import tn.esprit.projetintegre.entities.Wallet;
import tn.esprit.projetintegre.enums.TransactionStatus;
import tn.esprit.projetintegre.enums.TransactionType;
import tn.esprit.projetintegre.exception.ResourceNotFoundException;
import tn.esprit.projetintegre.dto.FinancialIndicatorsDTO;
import tn.esprit.projetintegre.dto.FinancialSummaryDTO;
import tn.esprit.projetintegre.repositories.TransactionRepository;
import tn.esprit.projetintegre.repositories.WalletRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class TransactionService {

    private static final long TRANSFER_CANCEL_WINDOW_SECONDS = 60;

    private final TransactionRepository transactionRepository;
    private final WalletRepository walletRepository;
    private final FraudDetectionService fraudDetectionService;

    public Page<Transaction> getAllTransactions(Pageable pageable) {
        return transactionRepository.findAll(pageable);
    }

    public Transaction getTransactionById(Long id) {
        return transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with id: " + id));
    }

    public Transaction getTransactionByNumber(String transactionNumber) {
        return transactionRepository.findByTransactionNumber(transactionNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with number: " + transactionNumber));
    }

    public void deleteTransaction(Long id) {

        Transaction transaction = getTransactionById(id);

        //  on ne peut supprimer que si PENDING
        if (transaction.getStatus() != TransactionStatus.PENDING) {
            throw new IllegalStateException("Cannot delete a processed transaction");
        }

        if (transaction.getType() == TransactionType.TRANSFER
                && transaction.getCreatedAt() != null
                && transaction.getCreatedAt().isBefore(LocalDateTime.now().minusSeconds(TRANSFER_CANCEL_WINDOW_SECONDS))) {
            throw new IllegalStateException("Transfer cancellation window has expired");
        }

        //  soft delete (cancelled)
        transaction.setStatus(TransactionStatus.CANCELLED);

        transactionRepository.save(transaction);
    }

    public Page<Transaction> getTransactionsByUserId(Long userId, Pageable pageable) {
        return transactionRepository.findByUserId(userId, pageable);
    }

    public Page<Transaction> getTransactionsByWalletId(Long walletId, Pageable pageable) {
        return transactionRepository.findByWalletId(walletId, pageable);
    }

    public Page<Transaction> getTransactionsByType(TransactionType type, Pageable pageable) {
        return transactionRepository.findByType(type, pageable);
    }

    public Transaction createTransaction(Transaction transaction, Long walletId) {

        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found with id: " + walletId));

        BigDecimal balanceBefore = wallet.getBalance() != null ? wallet.getBalance() : BigDecimal.ZERO;

        transaction.setWallet(wallet);
        transaction.setUser(wallet.getUser());
        transaction.setBalanceBefore(balanceBefore);
        transaction.setBalanceAfter(balanceBefore);
        transaction.setStatus(TransactionStatus.PENDING);

        if (transaction.getTransactionNumber() == null) {
            transaction.setTransactionNumber(generateTransactionNumber());
        }

        enrichFraudSignals(transaction);

        return transactionRepository.save(transaction);
    }

    // ✅ Mapping TransactionType → valeurs ML
    private String mapToMlType(TransactionType type) {
        return switch (type) {
            case DEPOSIT, REFUND -> "BILLS";
            case WITHDRAWAL, TRANSFER -> "SHOPPING";
            default -> "SHOPPING";
        };
    }

    // ✅ Mapping Role → valeurs ML
    private String mapToMlProfile(String role) {
        return switch (role.toUpperCase()) {
            case "PREMIUM", "ADMIN" -> "PREMIUM";
            case "ECONOMICAL" -> "ECONOMICAL";
            default -> "NORMAL";
        };
    }

    public Transaction saveTransaction(Transaction transaction) {
        if (transaction.getTransactionNumber() == null) {
            transaction.setTransactionNumber(generateTransactionNumber());
        }
        enrichFraudSignals(transaction);
        return transactionRepository.save(transaction);
    }

    private void enrichFraudSignals(Transaction transaction) {
        boolean isRecent = transaction.getCreatedAt() == null ||
                transaction.getCreatedAt().isAfter(LocalDateTime.now().minusMinutes(10));

        if (!isRecent || transaction.getAmount() == null || transaction.getType() == null) {
            return;
        }

        int hour = LocalDateTime.now().getHour();
        String transactionType = mapToMlType(transaction.getType());
        String userProfile = resolveMlProfile(transaction);
        int isStudent = 0;
        String timezone = "Africa/Tunis";

        FraudPrediction prediction = fraudDetectionService.predictFraud(
                transaction.getAmount().doubleValue(),
                hour,
                transactionType,
                userProfile,
                isStudent,
                timezone
        );

        if (prediction != null && prediction.isSuccess()) {
            transaction.setIsFraud(prediction.isFraud());
            transaction.setFraudProbability(prediction.getFraudProbability());
            transaction.setFraudRiskLevel(prediction.getRiskLevel());
        } else {
            transaction.setIsFraud(false);
            transaction.setFraudProbability(0.0);
            transaction.setFraudRiskLevel("UNKNOWN");
        }
    }

    private String resolveMlProfile(Transaction transaction) {
        if (transaction.getUser() != null && transaction.getUser().getRole() != null) {
            return mapToMlProfile(transaction.getUser().getRole().name());
        }
        if (transaction.getWallet() != null && transaction.getWallet().getUser() != null
                && transaction.getWallet().getUser().getRole() != null) {
            return mapToMlProfile(transaction.getWallet().getUser().getRole().name());
        }
        return "NORMAL";
    }

    private String generateTransactionNumber() {
        return "TXN-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 8);
    }

    public List<FinancialSummaryDTO> getUserFinancialSummary() {
        Map<Long, FinancialSummaryDTO> byUser = new HashMap<>();

        transactionRepository.findByStatus(TransactionStatus.COMPLETED).forEach(transaction -> {
            if (transaction.getUser() == null || transaction.getUser().getId() == null) {
                return;
            }

            FinancialSummaryDTO row = byUser.computeIfAbsent(transaction.getUser().getId(), userId ->
                    FinancialSummaryDTO.builder()
                            .userId(userId)
                            .userName(resolveUserName(transaction))
                            .totalDeposits(BigDecimal.ZERO)
                            .totalPurchases(BigDecimal.ZERO)
                            .totalWithdrawals(BigDecimal.ZERO)
                            .totalCashback(BigDecimal.ZERO)
                            .netChange(BigDecimal.ZERO)
                            .build()
            );

            BigDecimal amount = transaction.getAmount() != null ? transaction.getAmount() : BigDecimal.ZERO;
            if (transaction.getType() == null) {
                return;
            }
            switch (transaction.getType()) {
                case DEPOSIT -> row.setTotalDeposits(row.getTotalDeposits().add(amount));
                case PURCHASE -> row.setTotalPurchases(row.getTotalPurchases().add(amount));
                case WITHDRAWAL -> row.setTotalWithdrawals(row.getTotalWithdrawals().add(amount));
                case CASHBACK -> row.setTotalCashback(row.getTotalCashback().add(amount));
                default -> {
                }
            }

            row.setNetChange(row.getTotalDeposits()
                    .add(row.getTotalCashback())
                    .subtract(row.getTotalPurchases())
                    .subtract(row.getTotalWithdrawals()));
        });

        List<FinancialSummaryDTO> list = new ArrayList<>(byUser.values());
        list.sort(Comparator.comparing(FinancialSummaryDTO::getNetChange).reversed());
        return list;
    }

    public FinancialIndicatorsDTO getFinancialIndicators() {
        List<Transaction> completed = transactionRepository.findByStatus(TransactionStatus.COMPLETED);

        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal totalDeposits = BigDecimal.ZERO;
        BigDecimal totalWithdrawals = BigDecimal.ZERO;
        BigDecimal totalCashback = BigDecimal.ZERO;
        BigDecimal purchaseTotal = BigDecimal.ZERO;
        long purchaseCount = 0;
        java.util.Set<Long> activeUserIds = new java.util.HashSet<>();

        for (Transaction transaction : completed) {
            if (transaction.getUser() != null && transaction.getUser().getId() != null) {
                activeUserIds.add(transaction.getUser().getId());
            }

            BigDecimal amount = transaction.getAmount() != null ? transaction.getAmount() : BigDecimal.ZERO;
            if (transaction.getType() == null) {
                continue;
            }
            switch (transaction.getType()) {
                case PURCHASE -> {
                    totalRevenue = totalRevenue.add(amount);
                    purchaseTotal = purchaseTotal.add(amount);
                    purchaseCount++;
                }
                case DEPOSIT -> totalDeposits = totalDeposits.add(amount);
                case WITHDRAWAL -> totalWithdrawals = totalWithdrawals.add(amount);
                case CASHBACK -> totalCashback = totalCashback.add(amount);
                default -> {
                }
            }
        }

        BigDecimal netProfit = totalDeposits.add(totalCashback).subtract(totalRevenue).subtract(totalWithdrawals);
        BigDecimal averageCartValue = purchaseCount > 0
                ? purchaseTotal.divide(BigDecimal.valueOf(purchaseCount), 2, java.math.RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        BigDecimal retentionRate = totalDeposits.compareTo(BigDecimal.ZERO) > 0
                ? netProfit.multiply(BigDecimal.valueOf(100)).divide(totalDeposits, 2, java.math.RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return FinancialIndicatorsDTO.builder()
                .totalRevenue(totalRevenue)
                .totalDeposits(totalDeposits)
                .totalWithdrawals(totalWithdrawals)
                .totalCashback(totalCashback)
                .averageCartValue(averageCartValue)
                .totalTransactions((long) completed.size())
                .activeUsers((long) activeUserIds.size())
                .retentionRate(retentionRate)
                .netProfit(netProfit)
                .build();
    }

    private String resolveUserName(Transaction transaction) {
        String name = transaction.getUser().getName();
        return name != null && !name.isBlank() ? name : transaction.getUser().getUsername();
    }

    public Transaction confirmTransaction(Long transactionId) {

        Transaction transaction = getTransactionById(transactionId);

        if (transaction.getStatus() != TransactionStatus.PENDING) {
            throw new IllegalStateException("Transaction already processed");
        }

        Wallet wallet = transaction.getWallet();
        BigDecimal balanceBefore = wallet.getBalance() != null
                ? wallet.getBalance()
                : BigDecimal.ZERO;

        transaction.setBalanceBefore(balanceBefore);

        if (transaction.getType() == TransactionType.TRANSFER) {
            return confirmTransfer(transaction, balanceBefore);
        }

        if (transaction.getType() == TransactionType.DEPOSIT
                || transaction.getType() == TransactionType.REFUND
                || transaction.getType() == TransactionType.CASHBACK) {

            wallet.setBalance(balanceBefore.add(transaction.getAmount()));

        } else {
            if (balanceBefore.compareTo(transaction.getAmount()) < 0) {
                throw new IllegalStateException("Insufficient balance");
            }
            wallet.setBalance(balanceBefore.subtract(transaction.getAmount()));
        }

        transaction.setBalanceAfter(wallet.getBalance());
        transaction.setStatus(TransactionStatus.COMPLETED);
        transaction.setProcessedAt(LocalDateTime.now());

        walletRepository.save(wallet);

        return transactionRepository.save(transaction);
    }

    private Transaction confirmTransfer(Transaction transaction, BigDecimal senderBalanceBefore) {
        if (transaction.getReferenceId() == null) {
            throw new IllegalStateException("Transfer receiver is missing");
        }

        Wallet senderWallet = transaction.getWallet();
        Wallet receiverWallet = walletRepository.findByUserId(transaction.getReferenceId())
                .orElseThrow(() -> new ResourceNotFoundException("Receiver wallet not found for user id: " + transaction.getReferenceId()));

        BigDecimal amount = transaction.getAmount();
        if (senderBalanceBefore.compareTo(amount) < 0) {
            throw new IllegalStateException("Insufficient balance");
        }

        BigDecimal receiverBalanceBefore = receiverWallet.getBalance() != null ? receiverWallet.getBalance() : BigDecimal.ZERO;
        BigDecimal senderBalanceAfter = senderBalanceBefore.subtract(amount);
        BigDecimal receiverBalanceAfter = receiverBalanceBefore.add(amount);

        senderWallet.setBalance(senderBalanceAfter);
        receiverWallet.setBalance(receiverBalanceAfter);
        senderWallet.setUpdatedAt(LocalDateTime.now());
        receiverWallet.setUpdatedAt(LocalDateTime.now());

        transaction.setBalanceBefore(senderBalanceBefore);
        transaction.setBalanceAfter(senderBalanceAfter);
        transaction.setStatus(TransactionStatus.COMPLETED);
        transaction.setProcessedAt(LocalDateTime.now());

        walletRepository.save(senderWallet);
        walletRepository.save(receiverWallet);

        Transaction receiverTransaction = Transaction.builder()
                .transactionNumber(generateTransactionNumber())
                .user(receiverWallet.getUser())
                .wallet(receiverWallet)
                .type(TransactionType.TRANSFER)
                .amount(amount)
                .balanceBefore(receiverBalanceBefore)
                .balanceAfter(receiverBalanceAfter)
                .status(TransactionStatus.COMPLETED)
                .paymentMethod("TRANSFER")
                .description("Transfer from user ID: " + senderWallet.getUser().getId())
                .referenceType("TRANSFER_IN")
                .referenceId(senderWallet.getUser().getId())
                .createdAt(LocalDateTime.now())
                .processedAt(LocalDateTime.now())
                .build();
        enrichFraudSignals(receiverTransaction);
        transactionRepository.save(receiverTransaction);

        return transactionRepository.save(transaction);
    }

    public Page<Transaction> getTransactionsByStatus(String status, Pageable pageable) {
        return transactionRepository.findByStatus(
                TransactionStatus.valueOf(status.toUpperCase()),
                pageable
        );
    }
}
