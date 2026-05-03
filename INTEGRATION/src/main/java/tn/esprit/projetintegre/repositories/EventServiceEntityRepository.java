package tn.esprit.projetintegre.repositories;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.projetintegre.entities.EventServiceEntity;
import tn.esprit.projetintegre.enums.ServiceType;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventServiceEntityRepository extends JpaRepository<EventServiceEntity, Long> {

    @Override
    @EntityGraph(attributePaths = {"event", "provider"}) // Charge les relations nécessaires
    Optional<EventServiceEntity> findById(Long id);

    @EntityGraph(attributePaths = {"event", "provider"})
    List<EventServiceEntity> findByEventId(Long eventId);

    @EntityGraph(attributePaths = {"event", "provider"})
    List<EventServiceEntity> findByServiceType(ServiceType type);

    @EntityGraph(attributePaths = {"event", "provider"})
    List<EventServiceEntity> findByEventIdAndIncluded(Long eventId, Boolean included);

    @EntityGraph(attributePaths = {"event", "provider"})
    List<EventServiceEntity> findByProviderId(Long userId);
}