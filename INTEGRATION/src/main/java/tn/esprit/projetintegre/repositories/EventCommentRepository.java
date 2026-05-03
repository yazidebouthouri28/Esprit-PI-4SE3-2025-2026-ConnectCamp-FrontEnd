package tn.esprit.projetintegre.repositories;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.projetintegre.entities.EventComment;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventCommentRepository extends JpaRepository<EventComment, Long> {
    @Override
    @EntityGraph(attributePaths = {"event", "user"})
    List<EventComment> findAll();

    @Override
    @EntityGraph(attributePaths = {"event", "user"})
    Optional<EventComment> findById(Long id);

    @EntityGraph(attributePaths = {"event", "user"})
    List<EventComment> findByEventId(Long eventId);

    @EntityGraph(attributePaths = {"event", "user"})
    List<EventComment> findByUserId(Long userId);
}
