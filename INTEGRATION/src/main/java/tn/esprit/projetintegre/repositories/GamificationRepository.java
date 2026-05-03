package tn.esprit.projetintegre.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.projetintegre.entities.Gamification;

import java.util.List;

@Repository
public interface GamificationRepository extends JpaRepository<Gamification, Long> {
    List<Gamification> findByOrganizerId(Long organizerId);
}
