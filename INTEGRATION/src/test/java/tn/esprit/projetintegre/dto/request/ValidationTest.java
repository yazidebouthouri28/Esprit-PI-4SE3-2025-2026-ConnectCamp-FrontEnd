package tn.esprit.projetintegre.dto.request;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import tn.esprit.projetintegre.enums.HighlightCategory;

import java.math.BigDecimal;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class ValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUp() {
        try (ValidatorFactory factory = Validation.buildDefaultValidatorFactory()) {
            validator = factory.getValidator();
        }
    }

    @Test
    void testSiteRequestValidation_Invalid() {
        SiteRequest request = new SiteRequest();
        // name is empty -> should fail
        request.setName("");
        request.setCity("");
        request.setCapacity(-1);
        request.setPricePerNight(new BigDecimal("-10"));
        request.setLatitude(100.0); // beyond 90
        request.setOwnerId(null);
        request.setType("");
        request.setContactEmail("invalid-email");

        Set<ConstraintViolation<SiteRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty());
        // Should have multiple violations
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("Site name is required") || v.getMessage().contains("must be between 3 and 200")));
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("City is required")));
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("Capacity must be at least 1")));
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("Price per night must be a positive value")));
    }

    @Test
    void testSiteRequestValidation_Valid() {
        SiteRequest request = new SiteRequest();
        request.setName("Valid Camp");
        request.setCity("Tunis");
        request.setCapacity(10);
        request.setPricePerNight(new BigDecimal("50.0"));
        request.setLatitude(36.0);
        request.setLongitude(10.0);
        request.setType("FOREST");
        request.setOwnerId(1L);
        request.setContactPhone("+21612345678");

        Set<ConstraintViolation<SiteRequest>> violations = validator.validate(request);
        assertTrue(violations.isEmpty(), "Expected no violations, but got: " + violations);
    }

    @Test
    void testCampHighlightRequestValidation_Invalid() {
        CampHighlightRequest request = new CampHighlightRequest();
        request.setTitle("Hi"); // too short
        request.setContent("Short"); // too short (need 10)
        request.setCategory(null);
        request.setSiteId(null);

        Set<ConstraintViolation<CampHighlightRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("Title must be between 3 and 200")));
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("Content must be between 10 and 5000")));
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("Category is required")));
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("Site ID is required")));
    }

    @Test
    void testCampHighlightRequestValidation_Valid() {
        CampHighlightRequest request = new CampHighlightRequest();
        request.setTitle("A nice title");
        request.setContent("This is a sufficiently long content to pass.");
        request.setCategory(HighlightCategory.FAUNA);
        request.setSiteId(1L);

        Set<ConstraintViolation<CampHighlightRequest>> violations = validator.validate(request);
        assertTrue(violations.isEmpty());
    }
}
