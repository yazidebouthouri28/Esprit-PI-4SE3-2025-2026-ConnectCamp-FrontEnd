package tn.esprit.projetintegre.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;
import tn.esprit.projetintegre.dto.request.CampHighlightRequest;
import tn.esprit.projetintegre.dto.response.CampHighlightResponse;
import tn.esprit.projetintegre.enums.HighlightCategory;
import tn.esprit.projetintegre.services.CampHighlightService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/camp-highlights")
@RequiredArgsConstructor
public class CampHighlightController {

    private final CampHighlightService campHighlightService;

    @GetMapping("/all")
    public List<CampHighlightResponse> getAllHighlights() {
        return campHighlightService.getAllHighlights();
    }

    @GetMapping("/site/{siteId}")
    public List<CampHighlightResponse> getHighlightsBySite(@PathVariable Long siteId) {
        return campHighlightService.getHighlightsBySite(siteId);
    }

    @GetMapping("/site/{siteId}/category/{category}")
    public List<CampHighlightResponse> getHighlightsBySiteAndCategory(@PathVariable Long siteId,
            @PathVariable HighlightCategory category) {
        return campHighlightService.getHighlightsBySiteAndCategory(siteId, category);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CampHighlightResponse> getHighlightById(@PathVariable Long id) {
        return ResponseEntity.ok(campHighlightService.getHighlightById(id));
    }

    @PostMapping("/site/{siteId}")
    public ResponseEntity<CampHighlightResponse> createHighlight(@PathVariable Long siteId,
            @Valid @RequestBody CampHighlightRequest request) {
        return ResponseEntity.ok(campHighlightService.createHighlight(siteId, request));
    }

    /**
     * Uses {@link MultipartHttpServletRequest} so multipart parsing matches browser FormData
     * (avoids 400s seen with {@code @RequestPart} / strict {@code consumes} on some setups).
     */
    @PostMapping("/site/{siteId}/media")
    public ResponseEntity<Map<String, String>> uploadHighlightMedia(
            @PathVariable Long siteId,
            MultipartHttpServletRequest request) {
        MultipartFile resolved = request.getFile("file");
        if (resolved == null || resolved.isEmpty()) {
            resolved = request.getFile("media");
        }
        if (resolved == null || resolved.isEmpty()) {
            resolved = request.getFile("image");
        }
        if (resolved == null || resolved.isEmpty()) {
            for (MultipartFile f : request.getFileMap().values()) {
                if (f != null && !f.isEmpty()) {
                    resolved = f;
                    break;
                }
            }
        }
        if (resolved == null || resolved.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing file part (expected name: file)"));
        }
        String mediaUrl = campHighlightService.uploadHighlightMedia(siteId, resolved);
        return ResponseEntity.ok(Map.of("url", mediaUrl));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CampHighlightResponse> updateHighlight(@PathVariable Long id,
            @Valid @RequestBody CampHighlightRequest request) {
        return ResponseEntity.ok(campHighlightService.updateHighlight(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteHighlight(@PathVariable Long id) {
        campHighlightService.deleteHighlight(id);
        return ResponseEntity.noContent().build();
    }
}
