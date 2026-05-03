package tn.esprit.projetintegre.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.projetintegre.entities.Transaction;
import tn.esprit.projetintegre.entities.Wallet;
import tn.esprit.projetintegre.enums.TransactionStatus;
import tn.esprit.projetintegre.enums.TransactionType;
import tn.esprit.projetintegre.repositories.TransactionRepository;
import tn.esprit.projetintegre.repositories.WalletRepository;
import tn.esprit.projetintegre.services.TransactionService;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class CashbackScheduler {

    // Dépendances injectées
    private final TransactionRepository transactionRepository;
    private final WalletRepository walletRepository;
    private final TransactionService transactionService;

    // Constantes de configuration
    private static final BigDecimal CASHBACK_PERCENTAGE = new BigDecimal("0.01");
    private static final BigDecimal MIN_PURCHASE_AMOUNT = new BigDecimal("100");
    private static final String CASHBACK_PREFIX = "CBK-";
    private static final String CASHBACK_DESCRIPTION_TEMPLATE = "Cashback 1%% sur achat de %.2f DT";


    // @Scheduled(cron = "0 0 0 * * ?")
    //@Scheduled(fixedDelay = 30000)
    @Transactional
    public void processDailyCashback() {
        log.info("Démarrage du traitement cashback");
        long startTime = System.currentTimeMillis();

        try {
            LocalDate yesterday = LocalDate.now().minusDays(1);
            log.debug("Traitement des achats du: {}", yesterday);

            // Récupération des achats éligibles
            List<Transaction> eligiblePurchases = transactionRepository
                    .findPurchasesByDateAndMinAmount(
                            TransactionType.PURCHASE,
                            TransactionStatus.COMPLETED,
                            yesterday,
                            MIN_PURCHASE_AMOUNT
                    );

            if (eligiblePurchases == null || eligiblePurchases.isEmpty()) {
                log.info("Aucun achat éligible trouvé pour le {}", yesterday);
                return;
            }

            log.info("{} achat(s) éligible(s) trouvé(s)", eligiblePurchases.size());

            // Traitement des cashbacks
            CashbackResult result = processCashbacks(eligiblePurchases);

            long duration = System.currentTimeMillis() - startTime;
            log.info("Cashback terminé en {}ms - {} transactions traitées, total crédité: {} DT",
                    duration, result.count, result.totalAmount);

        } catch (Exception e) {
            log.error("Erreur lors du traitement du cashback", e);
            // Ne pas relancer l'exception pour éviter l'arrêt du scheduler
        }
    }

    private CashbackResult processCashbacks(List<Transaction> purchases) {
        int successCount = 0;
        BigDecimal totalCashback = BigDecimal.ZERO;

        for (Transaction purchase : purchases) {
            try {
                CashbackResultItem result = processSingleCashback(purchase);
                if (result.success) {
                    successCount++;
                    totalCashback = totalCashback.add(result.amount);
                }
            } catch (Exception e) {
                log.error("Erreur lors du traitement du cashback pour la transaction {}: {}",
                        purchase.getId(), e.getMessage(), e);
                // Continuer avec les autres transactions
            }
        }

        return new CashbackResult(successCount, totalCashback);
    }

    /**
     * Traite le cashback pour un seul achat.
     *
     * @param purchase la transaction d'achat
     * @return résultat du traitement
     */
    private CashbackResultItem processSingleCashback(Transaction purchase) {
        // Vérifications de sécurité
        if (purchase.getWallet() == null) {
            log.warn("Transaction {} sans wallet associé - cashback ignoré", purchase.getId());
            return CashbackResultItem.failed();
        }

        if (purchase.getUser() == null) {
            log.warn("Transaction {} sans utilisateur associé - cashback ignoré", purchase.getId());
            return CashbackResultItem.failed();
        }

        Wallet wallet = purchase.getWallet();
        BigDecimal cashbackAmount = calculateCashback(purchase.getAmount());

        // Sauvegarde de l'ancien solde avant modification
        BigDecimal oldBalance = wallet.getBalance();
        BigDecimal newBalance = safeAdd(oldBalance, cashbackAmount);

        // Mise à jour du wallet
        wallet.setBalance(newBalance);
        walletRepository.save(wallet);

        // Création de la transaction de cashback
        Transaction cashbackTransaction = buildCashbackTransaction(
                purchase, wallet, cashbackAmount, oldBalance, newBalance
        );

        transactionService.saveTransaction(cashbackTransaction);

        log.debug("Cashback de {} DT crédité à l'utilisateur {} (achat: {} DT)",
                cashbackAmount, purchase.getUser().getId(), purchase.getAmount());

        return CashbackResultItem.success(cashbackAmount);
    }

    /**
     * Calcule le montant du cashback (1% du montant de l'achat).
     *
     * @param purchaseAmount montant de l'achat
     * @return montant du cashback arrondi à 2 décimales
     */
    private BigDecimal calculateCashback(BigDecimal purchaseAmount) {
        if (purchaseAmount == null || purchaseAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return purchaseAmount
                .multiply(CASHBACK_PERCENTAGE)
                .setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Addition sécurisée de deux BigDecimal.
     *
     * @param a premier montant
     * @param b deuxième montant
     * @return somme, ou 0 si null
     */
    private BigDecimal safeAdd(BigDecimal a, BigDecimal b) {
        BigDecimal safeA = a != null ? a : BigDecimal.ZERO;
        BigDecimal safeB = b != null ? b : BigDecimal.ZERO;
        return safeA.add(safeB);
    }

    /**
     * Construit la transaction de cashback.
     *
     * @param purchase transaction d'achat originale
     * @param wallet wallet concerné
     * @param cashbackAmount montant du cashback
     * @param oldBalance solde avant
     * @param newBalance solde après
     * @return transaction de cashback prête à être sauvegardée
     */
    private Transaction buildCashbackTransaction(Transaction purchase, Wallet wallet,
                                                 BigDecimal cashbackAmount,
                                                 BigDecimal oldBalance, BigDecimal newBalance) {
        return Transaction.builder()
                .transactionNumber(generateTransactionNumber())
                .user(purchase.getUser())
                .wallet(wallet)
                .type(TransactionType.CASHBACK)
                .amount(cashbackAmount)
                .balanceBefore(oldBalance)
                .balanceAfter(newBalance)
                .status(TransactionStatus.COMPLETED)
                .paymentMethod("AUTOMATIC")
                .description(String.format(CASHBACK_DESCRIPTION_TEMPLATE, purchase.getAmount()))
                .createdAt(LocalDateTime.now())
                .processedAt(LocalDateTime.now())
                .build();
    }

    /**
     * Génère un numéro de transaction unique pour le cashback.
     * Format: CBK-timestamp-random
     *
     * @return numéro de transaction unique
     */
    private String generateTransactionNumber() {
        return CASHBACK_PREFIX + System.currentTimeMillis() + "-" +
                UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    // ==================== Classes internes pour les résultats ====================

    /**
     * Résultat global du traitement des cashbacks.
     */
    private record CashbackResult(int count, BigDecimal totalAmount) {}

    /**
     * Résultat du traitement d'un cashback individuel.
     */
    private static final class CashbackResultItem {
        final boolean success;
        final BigDecimal amount;

        private CashbackResultItem(boolean success, BigDecimal amount) {
            this.success = success;
            this.amount = amount;
        }

        static CashbackResultItem success(BigDecimal amount) {
            return new CashbackResultItem(true, amount);
        }

        static CashbackResultItem failed() {
            return new CashbackResultItem(false, BigDecimal.ZERO);
        }
    }
}