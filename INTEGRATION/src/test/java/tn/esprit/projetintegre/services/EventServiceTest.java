package tn.esprit.projetintegre.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Collections;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import tn.esprit.projetintegre.entities.Event;
import tn.esprit.projetintegre.entities.Organizer;
import tn.esprit.projetintegre.entities.User;
import tn.esprit.projetintegre.enums.EventStatus;
import tn.esprit.projetintegre.repositories.EventRepository;
import tn.esprit.projetintegre.repositories.OrganizerRepository;
import tn.esprit.projetintegre.repositories.SiteRepository;
import tn.esprit.projetintegre.repositories.UserRepository;
import tn.esprit.projetintegre.repositories.GamificationRepository;
import tn.esprit.projetintegre.repositories.ReservationRepository;
import tn.esprit.projetintegre.exception.BusinessException;

@ExtendWith(MockitoExtension.class)
public class EventServiceTest {

    @Mock
    private EventRepository eventRepository;
    @Mock
    private OrganizerRepository organizerRepository;
    @Mock
    private SiteRepository siteRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private GamificationRepository gamificationRepository;
    @Mock
    private ReservationRepository reservationRepository;

    @InjectMocks
    private EventService eventService;

    private Event event;
    private Organizer organizer;
    private Authentication adminAuth;

    @BeforeEach
    void setUp() {
        organizer = Organizer.builder().id(1L).build();
        event = Event.builder()
                .id(1L)
                .title("Mountain Hike")
                .startDate(LocalDateTime.now().plusDays(1))
                .status(EventStatus.DRAFT)
                .organizer(organizer)
                .build();

        adminAuth = mock(Authentication.class);
    }

    @Test
    void createEvent_Success() {
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("ROLE_ADMIN")))
                .when(adminAuth).getAuthorities();
        when(organizerRepository.findById(1L)).thenReturn(Optional.of(organizer));
        when(eventRepository.save(any(Event.class))).thenReturn(event);

        Event created = eventService.createEvent(event, null, 1L, null, adminAuth);

        assertNotNull(created);
        assertEquals("Mountain Hike", created.getTitle());
    }

    @Test
    void createEvent_PastDate_ThrowsException() {
        event.setStartDate(LocalDateTime.now().minusDays(1));

        assertThrows(BusinessException.class, () -> eventService.createEvent(event, null, 1L, null, adminAuth));
    }

    @Test
    void getEventById_Found() {
        when(eventRepository.findById(1L)).thenReturn(Optional.of(event));

        Event found = eventService.getEventById(1L);

        assertNotNull(found);
        assertEquals(1L, found.getId());
    }

    @Test
    void updateEventStatus_Success() {
        // Mock admin auth for simplicity
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("ROLE_ADMIN")))
                .when(adminAuth).getAuthorities();
        when(eventRepository.findById(1L)).thenReturn(Optional.of(event));
        when(eventRepository.save(any(Event.class))).thenReturn(event);

        Event updated = eventService.updateEventStatus(1L, EventStatus.PUBLISHED, adminAuth);

        assertEquals(EventStatus.PUBLISHED, updated.getStatus());
    }

    @Test
    void incrementViewCount_Success() {
        when(eventRepository.findById(1L)).thenReturn(Optional.of(event));
        event.setViewCount(5);

        eventService.incrementViewCount(1L);

        assertEquals(6, event.getViewCount());
        verify(eventRepository).save(event);
    }
}
