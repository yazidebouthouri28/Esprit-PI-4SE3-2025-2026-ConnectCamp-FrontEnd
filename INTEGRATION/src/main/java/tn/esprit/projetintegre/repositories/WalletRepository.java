package tn.esprit.projetintegre.repositories;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import tn.esprit.projetintegre.entities.Wallet;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface WalletRepository extends JpaRepository<Wallet, Long> {

    @EntityGraph(attributePaths = {"user"})
    Optional<Wallet> findByUserId(Long userId);

    boolean existsByUserId(Long userId);

    @Query("SELECT w FROM Wallet w " +
            "WHERE w.isActive = true " +
            "AND w.balance < :minBalance " +
            "AND w.updatedAt <= :cutoffDate")
    List<Wallet> findLowBalanceWallets(@Param("minBalance") BigDecimal minBalance,
                                       @Param("cutoffDate") LocalDateTime cutoffDate);


}