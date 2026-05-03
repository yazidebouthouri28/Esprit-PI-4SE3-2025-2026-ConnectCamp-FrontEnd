package tn.esprit.projetintegre.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import tn.esprit.projetintegre.entities.Cart;
import tn.esprit.projetintegre.entities.Coupon;
import tn.esprit.projetintegre.entities.Transaction;
import tn.esprit.projetintegre.entities.User;
import tn.esprit.projetintegre.entities.Wallet;
import tn.esprit.projetintegre.enums.PromotionType;
import tn.esprit.projetintegre.enums.Role;
import tn.esprit.projetintegre.enums.TransactionStatus;
import tn.esprit.projetintegre.enums.TransactionType;
import tn.esprit.projetintegre.repositories.CartRepository;
import tn.esprit.projetintegre.repositories.CouponRepository;
import tn.esprit.projetintegre.repositories.TransactionRepository;
import tn.esprit.projetintegre.repositories.UserRepository;
import tn.esprit.projetintegre.repositories.WalletRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CartRepository cartRepository;
    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;

    private final CouponRepository couponRepository;

    @Override
    public void run(String... args) {
        log.info("Starting data initialization...");
        User admin = initializeAdmin();
        initializeAdminFinanceDemoData(admin);
        log.info("Data initialization completed!");
    }

    private void initializeCoupons() {
        // Vérifier si le coupon existe déjà
        if (couponRepository.existsByCode("CAMP10")) {
            log.info("Coupon PROMO300 already exists. Skipping creation.");
            return;
        }

        Coupon coupon = Coupon.builder()
                .code("CAMP10")
                .description("10% de réduction sur les achats de 300 DT ou plus")
                .type(PromotionType.PERCENTAGE)
                .discountValue(BigDecimal.valueOf(10))
                .minOrderAmount(BigDecimal.valueOf(300))
                .maxDiscountAmount(BigDecimal.valueOf(50))
                .usageLimit(50)
                .usageLimitPerUser(1)
                .usageCount(0)
                .isActive(true)
                .isFirstOrderOnly(false)
                .validFrom(LocalDateTime.now())
                .validUntil(LocalDateTime.now().plusYears(1))
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        couponRepository.save(coupon);
        log.info("Coupon PROMO300 created successfully!");
    }

    private User initializeAdmin() {
        User admin = userRepository.findByUsername("ADMIN")
                .or(() -> userRepository.findByEmail("admin@connectcamp.local"))
                .orElseGet(User::new);

        admin.setUsername("ADMIN");
        admin.setEmail("admin@connectcamp.local");
        admin.setPassword(passwordEncoder.encode("ADMIN"));
        admin.setName("ADMIN");
        admin.setRole(Role.ADMIN);
        admin.setIsActive(true);
        admin.setIsSuspended(false);
        admin.setIsAdmin(true);
        admin.setIsSeller(true);
        admin.setIsBuyer(true);
        admin.setSellerVerified(true);
        admin.setEmailVerified(true);
        admin.setLoyaltyTier("BRONZE");
        // Set any other necessary fields

        admin = userRepository.save(admin);
        ensureCart(admin);
        ensureWallet(admin);
        log.info("Admin user ADMIN initialized.");
        return admin;
    }

    private void ensureCart(User user) {
        if (user.getId() != null && cartRepository.findByUserId(user.getId()).isPresent()) {
            return;
        }

        Cart cart = new Cart();
        cart.setUser(user);
        cart.setTotalAmount(BigDecimal.ZERO);
        cart.setDiscountAmount(BigDecimal.ZERO);
        cartRepository.save(cart);
    }

    private Wallet ensureWallet(User user) {
        if (user.getId() != null) {
            Optional<Wallet> existing = walletRepository.findByUserId(user.getId());
            if (existing.isPresent()) {
                Wallet wallet = existing.get();
                wallet.setIsActive(true);
                if (wallet.getCurrency() == null) {
                    wallet.setCurrency("TND");
                }
                return walletRepository.save(wallet);
            }
        }

        Wallet wallet = new Wallet();
        wallet.setUser(user);
        wallet.setBalance(BigDecimal.ZERO);
        wallet.setTotalDeposited(BigDecimal.ZERO);
        wallet.setTotalWithdrawn(BigDecimal.ZERO);
        wallet.setCurrency("TND");
        wallet.setIsActive(true);
        return walletRepository.save(wallet);
    }

    private void initializeAdminFinanceDemoData(User admin) {
        List<Transaction> completedTransactions = transactionRepository.findByStatus(TransactionStatus.COMPLETED);
        boolean adminAlreadyHasFinanceData = completedTransactions.stream()
                .anyMatch(transaction -> transaction.getUser() != null
                        && transaction.getUser().getId() != null
                        && transaction.getUser().getId().equals(admin.getId()));
        if (adminAlreadyHasFinanceData) {
            return;
        }

        Wallet wallet = ensureWallet(admin);
        BigDecimal balance = BigDecimal.ZERO;
        balance = saveFinanceSeedTransaction(admin, wallet, TransactionType.DEPOSIT, new BigDecimal("1500.00"), balance, "Initial wallet top-up");
        balance = saveFinanceSeedTransaction(admin, wallet, TransactionType.PURCHASE, new BigDecimal("320.00"), balance, "Camping gear order");
        balance = saveFinanceSeedTransaction(admin, wallet, TransactionType.CASHBACK, new BigDecimal("24.00"), balance, "Loyalty cashback");
        balance = saveFinanceSeedTransaction(admin, wallet, TransactionType.WITHDRAWAL, new BigDecimal("120.00"), balance, "Wallet withdrawal");
        wallet.setBalance(balance);
        wallet.setTotalDeposited(new BigDecimal("1500.00"));
        wallet.setTotalWithdrawn(new BigDecimal("120.00"));
        walletRepository.save(wallet);
        log.info("Admin finance demo transactions initialized.");
    }

    private BigDecimal saveFinanceSeedTransaction(
            User user,
            Wallet wallet,
            TransactionType type,
            BigDecimal amount,
            BigDecimal balanceBefore,
            String description
    ) {
        boolean credit = type == TransactionType.DEPOSIT || type == TransactionType.CASHBACK || type == TransactionType.REFUND;
        BigDecimal balanceAfter = credit ? balanceBefore.add(amount) : balanceBefore.subtract(amount);

        Transaction transaction = Transaction.builder()
                .transactionNumber("SEED-" + type.name() + "-" + UUID.randomUUID().toString().substring(0, 8))
                .user(user)
                .wallet(wallet)
                .type(type)
                .amount(amount)
                .balanceBefore(balanceBefore)
                .balanceAfter(balanceAfter)
                .status(TransactionStatus.COMPLETED)
                .paymentMethod("WALLET")
                .description(description)
                .isFraud(false)
                .fraudProbability(0.0)
                .fraudRiskLevel("LOW")
                .createdAt(LocalDateTime.now())
                .processedAt(LocalDateTime.now())
                .build();

        transactionRepository.save(transaction);
        return balanceAfter;
    }
}
