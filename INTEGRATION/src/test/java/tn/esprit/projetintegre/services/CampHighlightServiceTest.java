package tn.esprit.projetintegre.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.multipart.MultipartFile;
import tn.esprit.projetintegre.dto.request.CampHighlightRequest;
import tn.esprit.projetintegre.dto.response.CampHighlightResponse;
import tn.esprit.projetintegre.entities.CampHighlight;
import tn.esprit.projetintegre.entities.Site;
import tn.esprit.projetintegre.enums.HighlightCategory;
import tn.esprit.projetintegre.mapper.SiteModuleMapper;
import tn.esprit.projetintegre.repositories.CampHighlightRepository;
import tn.esprit.projetintegre.repositories.SiteRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CampHighlightServiceTest {

    @Mock
    private CampHighlightRepository campHighlightRepository;

    @Mock
    private SiteRepository siteRepository;

    @Mock
    private SiteModuleMapper siteMapper;

    @Mock
    private SiteImageStorageService siteImageStorageService;

    @InjectMocks
    private CampHighlightService campHighlightService;

    private Site testSite;
    private CampHighlightRequest testRequest;
    private CampHighlight testHighlight;
    private CampHighlightResponse testResponse;

    @BeforeEach
    void setUp() {
        testSite = new Site();
        testSite.setId(1L);

        testRequest = new CampHighlightRequest("Test Title", "Test Content", HighlightCategory.FAUNA, "url", true, 1L);

        testHighlight = new CampHighlight();
        testHighlight.setId(10L);
        testHighlight.setTitle("Test Title");
        testHighlight.setSite(testSite);

        testResponse = new CampHighlightResponse();
        testResponse.setId(10L);
        testResponse.setTitle("Test Title");
    }

    @Test
    void createHighlight_Success() {
        when(siteRepository.findById(1L)).thenReturn(Optional.of(testSite));
        when(siteMapper.toEntity(testRequest, testSite)).thenReturn(testHighlight);
        when(campHighlightRepository.save(any(CampHighlight.class))).thenReturn(testHighlight);
        when(siteMapper.toResponse(testHighlight)).thenReturn(testResponse);

        CampHighlightResponse result = campHighlightService.createHighlight(1L, testRequest);

        assertNotNull(result);
        assertEquals("Test Title", result.getTitle());
        verify(siteRepository, times(1)).findById(1L);
        verify(campHighlightRepository, times(1)).save(testHighlight);
    }

    @Test
    void createHighlight_SiteNotFound() {
        when(siteRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> {
            campHighlightService.createHighlight(1L, testRequest);
        });

        verify(siteRepository, times(1)).findById(1L);
        verify(campHighlightRepository, never()).save(any());
    }

    @Test
    void updateHighlight_Success() {
        when(campHighlightRepository.findById(10L)).thenReturn(Optional.of(testHighlight));
        doNothing().when(siteMapper).updateEntity(testHighlight, testRequest);
        when(campHighlightRepository.save(testHighlight)).thenReturn(testHighlight);
        when(siteMapper.toResponse(testHighlight)).thenReturn(testResponse);

        CampHighlightResponse result = campHighlightService.updateHighlight(10L, testRequest);

        assertNotNull(result);
        assertEquals("Test Title", result.getTitle());
        verify(siteMapper, times(1)).updateEntity(testHighlight, testRequest);
        verify(campHighlightRepository, times(1)).save(testHighlight);
    }

    @Test
    void deleteHighlight_Success() {
        when(campHighlightRepository.findById(10L)).thenReturn(Optional.of(testHighlight));
        doNothing().when(campHighlightRepository).delete(testHighlight);
        when(siteImageStorageService.deleteByPublicUrl(any())).thenReturn(true);

        campHighlightService.deleteHighlight(10L);

        verify(campHighlightRepository, times(1)).findById(10L);
        verify(campHighlightRepository, times(1)).delete(testHighlight);
        verify(siteImageStorageService, times(1)).deleteByPublicUrl(any());
    }

    @Test
    void getAllHighlights_Success() {
        when(campHighlightRepository.findAllWithSite()).thenReturn(List.of(testHighlight));
        when(siteMapper.toCampHighlightResponseList(List.of(testHighlight))).thenReturn(List.of(testResponse));

        List<CampHighlightResponse> result = campHighlightService.getAllHighlights();

        assertNotNull(result);
        assertFalse(result.isEmpty());
        assertEquals(1, result.size());
        verify(campHighlightRepository, times(1)).findAllWithSite();
    }
}
