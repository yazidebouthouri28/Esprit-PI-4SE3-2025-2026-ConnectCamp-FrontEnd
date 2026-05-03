package tn.esprit.projetintegre.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.projetintegre.entities.InterventionSecours;
import tn.esprit.projetintegre.enums.StatutIntervention;
import tn.esprit.projetintegre.enums.TypeUrgence;

import java.util.List;
import java.util.Optional;

@Repository
public interface InterventionSecoursRepository extends JpaRepository<InterventionSecours, Long> {

    @Override
    @EntityGraph(attributePaths = {"alerte", "responsable", "site"}) // Charge les relations nécessaires
    Optional<InterventionSecours> findById(Long id);

    @EntityGraph(attributePaths = {"alerte", "responsable", "site"})
    Optional<InterventionSecours> findByNumeroIntervention(String numero);

    @EntityGraph(attributePaths = {"alerte", "responsable", "site"})
    List<InterventionSecours> findByStatut(StatutIntervention statut);

    @EntityGraph(attributePaths = {"alerte", "responsable", "site"})
    Page<InterventionSecours> findByStatut(StatutIntervention statut, Pageable pageable);

    @EntityGraph(attributePaths = {"alerte", "responsable", "site"})
    List<InterventionSecours> findByTypeUrgence(TypeUrgence type);

    @EntityGraph(attributePaths = {"alerte", "responsable", "site"})
    List<InterventionSecours> findByAlerteId(Long alerteId);

    @EntityGraph(attributePaths = {"alerte", "responsable", "site"})
    List<InterventionSecours> findByResponsableId(Long userId);
}