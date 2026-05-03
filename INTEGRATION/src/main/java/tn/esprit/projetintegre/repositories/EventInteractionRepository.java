package tn.esprit.projetintegre.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.projetintegre.entities.EventInteraction;
import java.util.Optional;

@Repository
public interface EventInteractionRepository extends JpaRepository<EventInteraction, Long> {
    Optional<EventInteraction> findByUser_IdAndEvent_Id(Long userId, Long eventId);

    long countByEvent_IdAndLiked(Long eventId, Boolean liked);
}
