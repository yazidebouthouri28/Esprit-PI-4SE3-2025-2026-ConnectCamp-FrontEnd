package tn.esprit.projetintegre.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.esprit.projetintegre.entities.Site;
import tn.esprit.projetintegre.entities.User;
import tn.esprit.projetintegre.repositories.SiteRepository;
import tn.esprit.projetintegre.repositories.UserRepository;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SiteServiceTest {

    @Mock
    private SiteRepository siteRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private SiteService siteService;

    private Site site;
    private User owner;

    @BeforeEach
    void setUp() {
        owner = new User();
        owner.setId(1L);
        owner.setName("Owner Name");

        site = Site.builder()
                .id(1L)
                .name("Test Site")
                .city("Paris")
                .build();
    }

    @Test
    void testGetAllSites() {
        when(siteRepository.findAll()).thenReturn(Arrays.asList(site));

        List<Site> result = siteService.getAllSites();

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Test Site", result.get(0).getName());
        verify(siteRepository, times(1)).findAll();
    }

    @Test
    void testGetSiteById_Success() {
        when(siteRepository.findById(1L)).thenReturn(Optional.of(site));

        Site result = siteService.getSiteById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Test Site", result.getName());
    }

    @Test
    void testGetSiteById_NotFound() {
        when(siteRepository.findById(2L)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () -> siteService.getSiteById(2L));
        assertEquals("Site not found with id: 2", exception.getMessage());
    }

    @Test
    void testCreateSite() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        when(siteRepository.save(any(Site.class))).thenReturn(site);

        Site result = siteService.createSite(site, 1L);

        assertNotNull(result);
        assertEquals("Test Site", result.getName());
        verify(siteRepository, times(1)).save(site);
    }

    @Test
    void testDeleteSite() {
        when(siteRepository.findById(1L)).thenReturn(Optional.of(site));
        when(siteRepository.save(any(Site.class))).thenReturn(site);

        siteService.deleteSite(1L);

        assertFalse(site.getIsActive());
        verify(siteRepository, times(1)).save(site);
    }
}