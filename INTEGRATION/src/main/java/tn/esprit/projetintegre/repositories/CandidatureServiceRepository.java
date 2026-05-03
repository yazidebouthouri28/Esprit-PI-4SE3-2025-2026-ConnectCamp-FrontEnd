package tn.esprit.projetintegre.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.projetintegre.entities.CandidatureService;
import tn.esprit.projetintegre.enums.StatutCandidature;

import java.util.List;
import java.util.Optional;

@Repository
public interface CandidatureServiceRepository extends JpaRepository<CandidatureService, Long> {

    @EntityGraph(attributePaths = {"candidat", "service"}) // Charge les relations nécessaires
    Optional<CandidatureService> findByNumeroCandidature(String numero);

    @EntityGraph(attributePaths = {"candidat", "service"})
    List<CandidatureService> findByCandidatId(Long userId);

    @EntityGraph(attributePaths = {"candidat", "service"})
    Page<CandidatureService> findByCandidatId(Long userId, Pageable pageable);

    @EntityGraph(attributePaths = {"candidat", "service"})
    List<CandidatureService> findByServiceId(Long serviceId);

    @EntityGraph(attributePaths = {"candidat", "service"})
    List<CandidatureService> findByStatut(StatutCandidature statut);

    @EntityGraph(attributePaths = {"candidat", "service"})
    List<CandidatureService> findByServiceIdAndStatut(Long serviceId, StatutCandidature statut);

    @EntityGraph(attributePaths = {"candidat", "service"})
    Optional<CandidatureService> findById(Long id);

    boolean existsByCandidatIdAndServiceId(Long userId, Long serviceId);
}