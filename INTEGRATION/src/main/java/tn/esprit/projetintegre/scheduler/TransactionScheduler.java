package tn.esprit.projetintegre.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.projetintegre.entities.Transaction;
import tn.esprit.projetintegre.enums.TransactionStatus;
import tn.esprit.projetintegre.repositories.TransactionRepository;
import tn.esprit.projetintegre.services.TransactionService;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class TransactionScheduler {

    private final TransactionRepository transactionRepository;
    private final TransactionService transactionService;

    // exécution chaque 60sec
    @Scheduled(fixedRate = 5000)
    @Transactional
    public void processPendingTransactions() {

        log.info("🔄 Scheduler started: checking pending transactions...");

        List<Transaction> pendingTransactions =
                transactionRepository.findByStatus(TransactionStatus.PENDING);

        for (Transaction transaction : pendingTransactions) {

            try {
                // ⏳ attendre 5 minutes avant traitement
                if (transaction.getCreatedAt() != null &&
                        !transaction.getCreatedAt().isAfter(LocalDateTime.now().minusMinutes(1))) {

                    log.info("✅ Processing transaction ID: {}", transaction.getId());

                    transactionService.confirmTransaction(transaction.getId());
                }

            } catch (Exception e) {
                log.error("❌ Error processing transaction ID {}: {}",
                        transaction.getId(), e.getMessage());
            }
        }

        log.info("✅ Scheduler finished.");
    }
}
