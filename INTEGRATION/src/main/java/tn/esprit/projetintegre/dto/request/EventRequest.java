package tn.esprit.projetintegre.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.*;
import lombok.*;
import tn.esprit.projetintegre.enums.EventStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventRequest {

    @NotBlank(message = "Le titre de l'événement est obligatoire")
    @Size(min = 3, max = 200, message = "Le titre doit contenir entre 3 et 200 caractères")
    private String title;

    @Size(max = 2000, message = "La description ne peut pas dépasser 2000 caractères")
    private String description;

    @Size(max = 100, message = "Le type d'événement ne peut pas dépasser 100 caractères")
    private String eventType;

    @Size(max = 100, message = "La catégorie ne peut pas dépasser 100 caractères")
    private String category;

    @NotNull(message = "La date de début est obligatoire")
    private LocalDateTime startDate;

    @NotNull(message = "La date de fin est obligatoire")
    private LocalDateTime endDate;

    @Size(max = 500, message = "Le lieu ne peut pas dépasser 500 caractères")
    private String location;

    @DecimalMin(value = "-90.0", message = "Latitude invalide")
    @DecimalMax(value = "90.0", message = "Latitude invalide")
    private Double latitude;

    @DecimalMin(value = "-180.0", message = "Longitude invalide")
    @DecimalMax(value = "180.0", message = "Longitude invalide")
    private Double longitude;

    @Min(value = 1, message = "Le nombre maximum de participants doit être au moins 1")
    @Max(value = 100000, message = "Le nombre maximum de participants ne peut pas dépasser 100000")
    private Integer maxParticipants;

    @DecimalMin(value = "0.00", message = "Le prix ne peut pas être négatif")
    private BigDecimal price;

    private Boolean isFree;
    private Boolean isPublic;
    private Boolean requiresApproval;

    @Size(max = 20, message = "Maximum 20 images autorisées")
    private List<String> images;

    @Size(max = 500, message = "L'URL de la miniature ne peut pas dépasser 500 caractères")
    @JsonAlias("picture")
    private String thumbnail;

    private Long siteId;

    private Long organizerId;

    private EventStatus status;

    private List<Long> gamificationIds;

    private LocalDateTime registrationDeadline;
}
