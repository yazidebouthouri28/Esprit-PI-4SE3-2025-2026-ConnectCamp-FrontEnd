package tn.esprit.projetintegre.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.projetintegre.entities.Alert;
import tn.esprit.projetintegre.enums.AlertStatus;

import java.util.List;
import java.util.Optional;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {

    @Override
    @EntityGraph(attributePaths = {"site", "reportedBy", "resolvedBy"})
    Optional<Alert> findById(Long id);

    @Override
    @EntityGraph(attributePaths = {"site", "reportedBy", "resolvedBy"})
    List<Alert> findAll();

    @EntityGraph(attributePaths = {"site", "reportedBy", "resolvedBy"})
    List<Alert> findByStatus(AlertStatus status);

    @EntityGraph(attributePaths = {"site", "reportedBy", "resolvedBy"})
    Page<Alert> findBySiteId(Long siteId, Pageable pageable);

    @EntityGraph(attributePaths = {"site", "reportedBy", "resolvedBy"})
    List<Alert> findByStatusAndSiteId(AlertStatus status, Long siteId);
}
