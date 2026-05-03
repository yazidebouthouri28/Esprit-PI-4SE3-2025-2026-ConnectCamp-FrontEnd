package tn.esprit.projetintegre.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import tn.esprit.projetintegre.dto.FinancialIndicatorsDTO;
import tn.esprit.projetintegre.dto.FinancialSummaryDTO;
import tn.esprit.projetintegre.entities.Transaction;
import tn.esprit.projetintegre.enums.TransactionStatus;
import tn.esprit.projetintegre.enums.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    Page<Transaction> findByStatus(TransactionStatus status, Pageable pageable);

    List<Transaction> findByStatus(TransactionStatus status);

    @EntityGraph(attributePaths = {"wallet", "wallet.user"})
    Optional<Transaction> findByTransactionNumber(String transactionNumber);

    @EntityGraph(attributePaths = {"wallet", "wallet.user"})
    Page<Transaction> findByUserId(Long userId, Pageable pageable);

    @EntityGraph(attributePaths = {"wallet", "wallet.user"})
    Page<Transaction> findByWalletId(Long walletId, Pageable pageable);

    @EntityGraph(attributePaths = {"wallet", "wallet.user"})
    Page<Transaction> findByType(TransactionType type, Pageable pageable);

    @Query("SELECT t FROM Transaction t " +
            "WHERE t.type = :type " +
            "AND t.status = :status " +
            "AND DATE(t.createdAt) = :date " +
            "AND t.amount >= :minAmount")
    List<Transaction> findPurchasesByDateAndMinAmount(
            @Param("type") TransactionType type,
            @Param("status") TransactionStatus status,
            @Param("date") LocalDate date,
            @Param("minAmount") BigDecimal minAmount
    );

    @Query("SELECT new tn.esprit.projetintegre.dto.FinancialSummaryDTO(" +
            "u.id, " +
            "u.name, " +
            "COALESCE(SUM(CASE WHEN t.type = tn.esprit.projetintegre.enums.TransactionType.DEPOSIT THEN t.amount ELSE 0 END), 0), " +
            "COALESCE(SUM(CASE WHEN t.type = tn.esprit.projetintegre.enums.TransactionType.PURCHASE THEN t.amount ELSE 0 END), 0), " +
            "COALESCE(SUM(CASE WHEN t.type = tn.esprit.projetintegre.enums.TransactionType.WITHDRAWAL THEN t.amount ELSE 0 END), 0), " +
            "COALESCE(SUM(CASE WHEN t.type = tn.esprit.projetintegre.enums.TransactionType.CASHBACK THEN t.amount ELSE 0 END), 0), " +
            "COALESCE(SUM(CASE WHEN t.type = tn.esprit.projetintegre.enums.TransactionType.DEPOSIT THEN t.amount ELSE 0 END), 0) + " +
            "COALESCE(SUM(CASE WHEN t.type = tn.esprit.projetintegre.enums.TransactionType.CASHBACK THEN t.amount ELSE 0 END), 0) - " +
            "COALESCE(SUM(CASE WHEN t.type = tn.esprit.projetintegre.enums.TransactionType.PURCHASE THEN t.amount ELSE 0 END), 0) - " +
            "COALESCE(SUM(CASE WHEN t.type = tn.esprit.projetintegre.enums.TransactionType.WITHDRAWAL THEN t.amount ELSE 0 END), 0) " +
            ") " +
            "FROM Transaction t " +
            "JOIN t.user u " +
            "WHERE t.status = :status " +
            "GROUP BY u.id, u.name")
    List<FinancialSummaryDTO> getUserFinancialSummary(@Param("status") TransactionStatus status);

    @Query("SELECT new tn.esprit.projetintegre.dto.FinancialIndicatorsDTO(" +
            "COALESCE(SUM(CASE WHEN t.type = tn.esprit.projetintegre.enums.TransactionType.PURCHASE THEN t.amount ELSE 0 END), 0), " +
            "COALESCE(SUM(CASE WHEN t.type = tn.esprit.projetintegre.enums.TransactionType.DEPOSIT THEN t.amount ELSE 0 END), 0), " +
            "COALESCE(SUM(CASE WHEN t.type = tn.esprit.projetintegre.enums.TransactionType.WITHDRAWAL THEN t.amount ELSE 0 END), 0), " +
            "COALESCE(SUM(CASE WHEN t.type = tn.esprit.projetintegre.enums.TransactionType.CASHBACK THEN t.amount ELSE 0 END), 0), " +
            "COALESCE(AVG(CASE WHEN t.type = tn.esprit.projetintegre.enums.TransactionType.PURCHASE THEN t.amount ELSE NULL END), 0), " +
            "COUNT(t.id), " +
            "COUNT(DISTINCT t.user.id), " +
            "CASE WHEN SUM(CASE WHEN t.type = tn.esprit.projetintegre.enums.TransactionType.DEPOSIT THEN t.amount ELSE 0 END) > 0 " +
            "THEN (SUM(CASE WHEN t.type = tn.esprit.projetintegre.enums.TransactionType.DEPOSIT THEN t.amount ELSE 0 END) + " +
            "      SUM(CASE WHEN t.type = tn.esprit.projetintegre.enums.TransactionType.CASHBACK THEN t.amount ELSE 0 END) - " +
            "      SUM(CASE WHEN t.type = tn.esprit.projetintegre.enums.TransactionType.PURCHASE THEN t.amount ELSE 0 END) - " +
            "      SUM(CASE WHEN t.type = tn.esprit.projetintegre.enums.TransactionType.WITHDRAWAL THEN t.amount ELSE 0 END)) * 100 / " +
            "      SUM(CASE WHEN t.type = tn.esprit.projetintegre.enums.TransactionType.DEPOSIT THEN t.amount ELSE 0 END) " +
            "ELSE 0 END, " +
            "SUM(CASE WHEN t.type = tn.esprit.projetintegre.enums.TransactionType.DEPOSIT THEN t.amount ELSE 0 END) + " +
            "SUM(CASE WHEN t.type = tn.esprit.projetintegre.enums.TransactionType.CASHBACK THEN t.amount ELSE 0 END) - " +
            "SUM(CASE WHEN t.type = tn.esprit.projetintegre.enums.TransactionType.PURCHASE THEN t.amount ELSE 0 END) - " +
            "SUM(CASE WHEN t.type = tn.esprit.projetintegre.enums.TransactionType.WITHDRAWAL THEN t.amount ELSE 0 END) " +
            ") " +
            "FROM Transaction t " +
            "WHERE t.status = :status")
    FinancialIndicatorsDTO getFinancialIndicators(@Param("status") TransactionStatus status);

}
