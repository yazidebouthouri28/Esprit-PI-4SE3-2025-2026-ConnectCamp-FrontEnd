package tn.esprit.projetintegre.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import tn.esprit.projetintegre.dto.request.GamificationRequest;
import tn.esprit.projetintegre.entities.Gamification;
import tn.esprit.projetintegre.repositories.EventRepository;
import tn.esprit.projetintegre.repositories.GamificationRepository;
import tn.esprit.projetintegre.repositories.OrganizerRepository;

@ExtendWith(MockitoExtension.class)
public class GamificationServiceTest {

    @Mock
    private GamificationRepository gamificationRepository;

    @Mock
    private EventRepository eventRepository;

    @Mock
    private OrganizerRepository organizerRepository;

    @InjectMocks
    private GamificationService gamificationService;

    private GamificationRequest validRequest;
    private Gamification badge;

    @BeforeEach
    void setUp() {
        validRequest = GamificationRequest.builder()
                .name("Explorer")
                .description("Discover 5 sites")
                .icon("map")
                .pointsValue(100)
                .build();

        badge = Gamification.builder()
                .id(1L)
                .name("Explorer")
                .description("Discover 5 sites")
                .icon("map")
                .pointsValue(100)
                .build();
    }

    @Test
    void createGamification_Success() {
        when(gamificationRepository.save(any(Gamification.class))).thenReturn(badge);

        Gamification created = gamificationService.createGamification(validRequest);

        assertNotNull(created);
        assertEquals("Explorer", created.getName());
        verify(gamificationRepository, times(1)).save(any(Gamification.class));
    }

    @Test
    void getGamificationById_Found() {
        when(gamificationRepository.findById(1L)).thenReturn(Optional.of(badge));

        Gamification found = gamificationService.getGamificationById(1L);

        assertNotNull(found);
        assertEquals(1L, found.getId());
    }

    @Test
    void getGamificationById_NotFound() {
        when(gamificationRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> gamificationService.getGamificationById(99L));
    }

    @Test
    void updateGamification_Success() {
        when(gamificationRepository.findById(1L)).thenReturn(Optional.of(badge));
        when(gamificationRepository.save(any(Gamification.class))).thenReturn(badge);

        validRequest.setName("Master Explorer");
        Gamification updated = gamificationService.updateGamification(1L, validRequest);

        assertEquals("Master Explorer", updated.getName());
    }

    @Test
    void deleteGamification_Success() {
        doNothing().when(gamificationRepository).deleteById(1L);

        gamificationService.deleteGamification(1L);

        verify(gamificationRepository, times(1)).deleteById(1L);
    }
}
