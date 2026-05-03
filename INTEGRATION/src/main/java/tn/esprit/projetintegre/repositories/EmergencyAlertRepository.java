package tn.esprit.projetintegre.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import tn.esprit.projetintegre.entities.EmergencyAlert;
import tn.esprit.projetintegre.enums.AlertStatus;
import tn.esprit.projetintegre.enums.EmergencyType;
import tn.esprit.projetintegre.enums.EmergencySeverity;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmergencyAlertRepository extends JpaRepository<EmergencyAlert, Long> {

    @EntityGraph(attributePaths = {"site", "reportedBy"}) // Charge les relations nécessaires
    Optional<EmergencyAlert> findById(Long id);

    @EntityGraph(attributePaths = {"site", "reportedBy"})
    Optional<EmergencyAlert> findByAlertCode(String alertCode);

    @EntityGraph(attributePaths = {"site", "reportedBy"})
    Page<EmergencyAlert> findByStatus(AlertStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"site", "reportedBy"})
    Page<EmergencyAlert> findByEmergencyType(EmergencyType type, Pageable pageable);

    @EntityGraph(attributePaths = {"site", "reportedBy"})
    Page<EmergencyAlert> findBySeverity(EmergencySeverity severity, Pageable pageable);

    @EntityGraph(attributePaths = {"site", "reportedBy"})
    Page<EmergencyAlert> findBySiteId(Long siteId, Pageable pageable);

    @EntityGraph(attributePaths = {"site", "reportedBy"})
    @Query("SELECT ea FROM EmergencyAlert ea WHERE ea.status IN ('ACTIVE', 'ACKNOWLEDGED') ORDER BY ea.severity DESC, ea.reportedAt DESC")
    List<EmergencyAlert> findActiveAlerts();

    @EntityGraph(attributePaths = {"site", "reportedBy"})
    @Query("SELECT ea FROM EmergencyAlert ea WHERE ea.site.id = :siteId AND ea.status IN ('ACTIVE', 'ACKNOWLEDGED')")
    List<EmergencyAlert> findActiveAlertsBySite(@Param("siteId") Long siteId);

    @EntityGraph(attributePaths = {"site", "reportedBy"})
    @Query("SELECT ea FROM EmergencyAlert ea WHERE ea.severity = 'CRITICAL' AND ea.status = 'ACTIVE'")
    List<EmergencyAlert> findCriticalActiveAlerts();

    @EntityGraph(attributePaths = {"site", "reportedBy"})
    @Query("SELECT ea FROM EmergencyAlert ea WHERE ea.reportedAt >= :startDate AND ea.reportedAt <= :endDate")
    Page<EmergencyAlert> findByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate, Pageable pageable);

    @Query("SELECT COUNT(ea) FROM EmergencyAlert ea WHERE ea.site.id = :siteId AND ea.status = :status")
    Long countBySiteIdAndStatus(@Param("siteId") Long siteId, @Param("status") AlertStatus status);

    @EntityGraph(attributePaths = {"site", "reportedBy"})
    @Query("SELECT ea FROM EmergencyAlert ea WHERE ea.evacuationRequired = true AND ea.status = 'ACTIVE'")
    List<EmergencyAlert> findActiveEvacuationAlerts();
}