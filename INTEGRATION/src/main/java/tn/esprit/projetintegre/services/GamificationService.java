package tn.esprit.projetintegre.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.projetintegre.dto.request.GamificationRequest;
import tn.esprit.projetintegre.entities.Gamification;
import tn.esprit.projetintegre.entities.Event;
import tn.esprit.projetintegre.repositories.GamificationRepository;
import tn.esprit.projetintegre.repositories.EventRepository;

import tn.esprit.projetintegre.repositories.OrganizerRepository;
import tn.esprit.projetintegre.entities.Organizer;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class GamificationService {

    private final GamificationRepository gamificationRepository;
    private final EventRepository eventRepository;
    private final OrganizerRepository organizerRepository;

    public List<Gamification> getAllGamifications() {
        return gamificationRepository.findAll();
    }

    public List<Gamification> getGamificationsByOrganizer(Long organizerId) {
        return gamificationRepository.findByOrganizerId(organizerId);
    }

    public Gamification getGamificationById(Long id) {
        return gamificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Gamification not found"));
    }

    public Gamification createGamification(GamificationRequest request) {
        Organizer organizer = null;
        if (request.getOrganizerId() != null) {
            organizer = organizerRepository.findById(request.getOrganizerId())
                    .orElseThrow(() -> new RuntimeException("Organizer not found"));
        }

        Gamification gamification = Gamification.builder()
                .name(request.getName())
                .description(request.getDescription())
                .icon(request.getIcon())
                .pointsValue(request.getPointsValue())
                .organizer(organizer)
                .build();
        return gamificationRepository.save(gamification);
    }

    public Gamification updateGamification(Long id, GamificationRequest request) {
        Gamification gamification = getGamificationById(id);

        // Ownership check could be added here if we pass Authentication,
        // but for now we'll handle the logic of updating fields.

        gamification.setName(request.getName());
        gamification.setDescription(request.getDescription());
        gamification.setIcon(request.getIcon());
        gamification.setPointsValue(request.getPointsValue());

        if (request.getOrganizerId() != null) {
            Organizer organizer = organizerRepository.findById(request.getOrganizerId())
                    .orElseThrow(() -> new RuntimeException("Organizer not found"));
            gamification.setOrganizer(organizer);
        }

        return gamificationRepository.save(gamification);
    }

    public void deleteGamification(Long id) {
        gamificationRepository.deleteById(id);
    }

    public void assignGamificationToEvent(Long gamificationId, Long eventId) {
        Gamification gamification = getGamificationById(gamificationId);
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        event.getGamifications().add(gamification);
        eventRepository.save(event);
    }

    public void removeGamificationFromEvent(Long gamificationId, Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        event.getGamifications().removeIf(g -> g.getId().equals(gamificationId));
        eventRepository.save(event);
    }
}
