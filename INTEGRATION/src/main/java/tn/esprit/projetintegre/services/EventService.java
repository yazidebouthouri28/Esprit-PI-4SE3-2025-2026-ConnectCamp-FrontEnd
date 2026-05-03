package tn.esprit.projetintegre.services;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import tn.esprit.projetintegre.entities.Event;
import tn.esprit.projetintegre.entities.Organizer;
import tn.esprit.projetintegre.entities.Site;
import tn.esprit.projetintegre.entities.User;
import tn.esprit.projetintegre.enums.EventStatus;
import tn.esprit.projetintegre.exception.BusinessException;
import tn.esprit.projetintegre.exception.ResourceNotFoundException;
import tn.esprit.projetintegre.repositories.EventRepository;
import tn.esprit.projetintegre.repositories.OrganizerRepository;
import tn.esprit.projetintegre.repositories.SiteRepository;
import tn.esprit.projetintegre.repositories.UserRepository;
import tn.esprit.projetintegre.repositories.GamificationRepository;
import tn.esprit.projetintegre.repositories.ReservationRepository;
import tn.esprit.projetintegre.entities.Gamification;
import tn.esprit.projetintegre.entities.Reservation;
import tn.esprit.projetintegre.enums.ReservationStatus;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EventService {
    private final OrganizerRepository organizerRepository;
    private final EventRepository eventRepository;
    private final SiteRepository siteRepository;
    private final UserRepository userRepository;
    private final GamificationRepository gamificationRepository;
    private final ReservationRepository reservationRepository;

    public List<Event> getAllEvents() {
        return eventRepository.findAll();
    }

    public Page<Event> getEventsByStatus(EventStatus status, Pageable pageable) {
        return eventRepository.findByStatus(status, pageable);
    }

    public Event getEventById(Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + id));
    }

    public List<Event> getUpcomingEvents(int limit) {
        return eventRepository.findUpcomingEvents(LocalDateTime.now(), PageRequest.of(0, limit));
    }

    public Page<Event> searchEvents(String keyword, Pageable pageable) {
        return eventRepository.searchEvents(keyword, pageable);
    }

    public Page<Event> getEventsByOrganizer(Long organizerId, Pageable pageable) {
        return eventRepository.findByOrganizerId(organizerId, pageable);
    }

    public Page<Event> getEventsBySite(Long siteId, Pageable pageable) {
        return eventRepository.findBySiteId(siteId, pageable);
    }

    @Transactional
    public Event createEvent(Event event, Long siteId, Long organizerId, List<Long> gamificationIds,
            Authentication authentication) {
        if (event.getStartDate() != null && event.getStartDate().isBefore(LocalDateTime.now())) {
            throw new BusinessException("La date de début doit être dans le futur pour un nouvel événement");
        }

        if (siteId != null) {
            Site site = siteRepository.findById(siteId)
                    .orElseThrow(() -> new ResourceNotFoundException("Site not found"));
            event.setSite(site);
        }

        String authenticatedUsername = authentication != null ? authentication.getName() : null;
        Organizer organizer;
        if (isAdmin(authentication)) {
            organizer = resolveOrganizer(organizerId, authenticatedUsername);
        } else {
            Organizer self = resolveOrganizer(null, authenticatedUsername);
            if (organizerId != null && organizerId > 0 && !self.getId().equals(organizerId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only create events as yourself");
            }
            organizer = self;
        }
        event.setOrganizer(organizer);
        if (event.getStatus() == null) {
            event.setStatus(isAdmin(authentication) ? EventStatus.DRAFT : EventStatus.PUBLISHED);
        }

        if (gamificationIds != null && !gamificationIds.isEmpty()) {
            List<Gamification> gamifications = gamificationRepository
                    .findAllById(gamificationIds);
            event.setGamifications(new java.util.HashSet<>(gamifications));
        }

        return eventRepository.save(event);
    }

    private Organizer resolveOrganizer(Long organizerId, String authenticatedUsername) {
        // If frontend passes an organizerId but it's invalid/not found, fall back to
        // authenticated user.
        if (organizerId != null && organizerId > 0) {
            var byId = organizerRepository.findById(organizerId);
            if (byId.isPresent()) {
                return byId.get();
            }
        }

        if (authenticatedUsername == null || authenticatedUsername.isBlank()) {
            throw new ResourceNotFoundException("Organizer not found");
        }

        User user = userRepository.findByUsername(authenticatedUsername)
                .or(() -> userRepository.findByEmail(authenticatedUsername))
                .orElseThrow(() -> new ResourceNotFoundException("Organizer not found"));

        return organizerRepository.findByUser_Id(user.getId())
                .orElseGet(() -> organizerRepository.save(Organizer.builder()
                        .user(user)
                        .companyName(user.getName() + "'s Organization")
                        .verified(true)
                        .active(true)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build()));
    }

    public void assertCanAccessOrganizerScope(Long organizerId, Authentication authentication) {
        if (isAdmin(authentication)) {
            return;
        }
        Organizer self = resolveOrganizer(null, authentication != null ? authentication.getName() : null);
        if (!self.getId().equals(organizerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only access your own organizer data");
        }
    }

    private boolean isAdmin(Authentication authentication) {
        if (authentication == null) {
            return false;
        }
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> role.equals("ROLE_ADMIN") || role.equals("ADMIN"));
    }

    private void assertOrganizerOwnsEvent(Event event, Authentication authentication) {
        if (isAdmin(authentication)) {
            return;
        }
        if (authentication == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        User user = userRepository.findByUsername(authentication.getName())
                .or(() -> userRepository.findByEmail(authentication.getName()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "User not found"));
        Organizer org = organizerRepository.findByUser_Id(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Organizer profile required"));
        if (event.getOrganizer() == null || !event.getOrganizer().getId().equals(org.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only manage your own events");
        }
    }

    @Transactional
    public Event updateEvent(Long id, Event eventDetails, List<Long> gamificationIds, Authentication authentication) {
        Event event = getEventById(id);
        assertOrganizerOwnsEvent(event, authentication);

        if (eventDetails.getTitle() != null)
            event.setTitle(eventDetails.getTitle());
        if (eventDetails.getDescription() != null)
            event.setDescription(eventDetails.getDescription());
        if (eventDetails.getEventType() != null)
            event.setEventType(eventDetails.getEventType());
        if (eventDetails.getCategory() != null)
            event.setCategory(eventDetails.getCategory());
        if (eventDetails.getStartDate() != null)
            event.setStartDate(eventDetails.getStartDate());
        if (eventDetails.getEndDate() != null)
            event.setEndDate(eventDetails.getEndDate());
        if (eventDetails.getMaxParticipants() != null)
            event.setMaxParticipants(eventDetails.getMaxParticipants());
        if (eventDetails.getPrice() != null)
            event.setPrice(eventDetails.getPrice());
        if (eventDetails.getIsFree() != null)
            event.setIsFree(eventDetails.getIsFree());
        if (eventDetails.getImages() != null)
            event.setImages(eventDetails.getImages());
        if (eventDetails.getThumbnail() != null)
            event.setThumbnail(eventDetails.getThumbnail());
        if (eventDetails.getLocation() != null)
            event.setLocation(eventDetails.getLocation());
        if (eventDetails.getStatus() != null)
            event.setStatus(eventDetails.getStatus());

        if (gamificationIds != null) {
            List<Gamification> gamifications = gamificationRepository
                    .findAllById(gamificationIds);
            event.setGamifications(new java.util.HashSet<>(gamifications));
        }

        return eventRepository.save(event);
    }

    @Transactional
    public Event updateEventStatus(Long id, EventStatus status, Authentication authentication) {
        Event event = getEventById(id);
        assertOrganizerOwnsEvent(event, authentication);

        EventStatus oldStatus = event.getStatus();
        event.setStatus(status);

        if (status == EventStatus.COMPLETED && oldStatus != EventStatus.COMPLETED) {
            awardBadgesToParticipants(event);
        }

        return eventRepository.save(event);
    }

    private void awardBadgesToParticipants(Event event) {
        if (event.getGamifications() == null || event.getGamifications().isEmpty()) {
            return;
        }

        List<Reservation> confirmedReservations = reservationRepository.findByEventIdAndStatus(event.getId(),
                ReservationStatus.CONFIRMED);

        for (Reservation res : confirmedReservations) {
            User user = res.getUser();
            if (user != null) {
                boolean updated = false;
                for (Gamification badge : event.getGamifications()) {
                    if (!user.getEarnedBadges().contains(badge)) {
                        user.getEarnedBadges().add(badge);
                        user.setExperiencePoints((user.getExperiencePoints() == null ? 0 : user.getExperiencePoints())
                                + badge.getPointsValue());
                        updated = true;
                    }
                }
                if (updated) {
                    user.setTotalMissionsCompleted(
                            (user.getTotalMissionsCompleted() == null ? 0 : user.getTotalMissionsCompleted()) + 1);
                    // Simple leveling: 1000 XP per level
                    int xp = user.getExperiencePoints() == null ? 0 : user.getExperiencePoints();
                    user.setLevel((xp / 1000) + 1);
                    userRepository.save(user);
                }
            }
        }
    }

    @Transactional
    public Event publishEvent(Long id, Authentication authentication) {
        Event event = getEventById(id);
        assertOrganizerOwnsEvent(event, authentication);
        if (event.getStartDate() == null || event.getEndDate() == null) {
            throw new IllegalStateException("Event dates must be set before publishing");
        }
        event.setStatus(EventStatus.PUBLISHED);
        return eventRepository.save(event);
    }

    @Transactional
    public void incrementViewCount(Long id) {
        Event event = getEventById(id);
        event.setViewCount(event.getViewCount() + 1);
        eventRepository.save(event);
    }

    @Transactional
    public void deleteEvent(Long id, Authentication authentication) {
        Event event = getEventById(id);
        assertOrganizerOwnsEvent(event, authentication);
        event.setStatus(EventStatus.CANCELLED);
        eventRepository.save(event);
    }

    @Transactional
    public void bulkDeleteEvents(List<Long> ids, Authentication authentication) {
        List<Event> events = eventRepository.findAllById(ids);
        for (Event event : events) {
            assertOrganizerOwnsEvent(event, authentication);
            event.setStatus(EventStatus.CANCELLED);
        }
        eventRepository.saveAll(events);
    }

    public Long getTotalViewsByOrganizer(Long organizerId) {
        return eventRepository.sumViewCountByOrganizerId(organizerId);
    }

    public Long getTotalViewsForAllEvents() {
        return eventRepository.sumAllViewCounts();
    }
}
