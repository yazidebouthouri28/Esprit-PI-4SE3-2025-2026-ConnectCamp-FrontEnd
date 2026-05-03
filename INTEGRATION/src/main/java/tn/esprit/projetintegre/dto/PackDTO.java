package tn.esprit.projetintegre.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import tn.esprit.projetintegre.enums.PackType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class PackDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        @NotBlank(message = "Le nom du pack est obligatoire")
        @Size(min = 3, max = 100, message = "Le nom doit contenir entre 3 et 100 caractères")
        private String name;

        @NotBlank(message = "La description est obligatoire")
        @Size(min = 10, max = 2000, message = "La description doit contenir entre 10 et 2000 caractères")
        private String description;

        @NotNull(message = "Le type de pack est obligatoire")
        private PackType packType;

        @NotNull(message = "Le prix est obligatoire")
        @DecimalMin(value = "0.0", message = "Le prix doit être positif ou nul")
        private BigDecimal price;

        @DecimalMin(value = "0.0", message = "Le prix original doit être positif ou nul")
        private BigDecimal originalPrice;

        @Min(value = 1, message = "La durée doit être au moins 1 jour")
        private Integer durationDays;

        @Min(value = 1, message = "Le nombre de personnes doit être au moins 1")
        private Integer maxPersons;

        private String image;
        private List<String> images;
        private List<String> features;
        private List<String> inclusions;
        private List<String> exclusions;

        private Boolean isFeatured = false;
        private Boolean isLimitedOffer = false;
        private Integer availableQuantity;
        private LocalDateTime validFrom;
        private LocalDateTime validUntil;

        private Long siteId;
        private List<Long> serviceIds;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        @Size(min = 3, max = 100, message = "Le nom doit contenir entre 3 et 100 caractères")
        private String name;

        @Size(min = 10, max = 2000, message = "La description doit contenir entre 10 et 2000 caractères")
        private String description;

        private PackType packType;
        private BigDecimal price;
        private BigDecimal originalPrice;
        private Integer durationDays;
        private Integer maxPersons;
        private String image;
        private List<String> images;
        private List<String> features;
        private List<String> inclusions;
        private List<String> exclusions;
        private Boolean isActive;
        private Boolean isFeatured;
        private Boolean isLimitedOffer;
        private Integer availableQuantity;
        private LocalDateTime validFrom;
        private LocalDateTime validUntil;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private String name;
        private String description;
        private PackType packType;
        private BigDecimal price;
        private BigDecimal originalPrice;
        private BigDecimal discountPercentage;
        private Integer durationDays;
        private Integer maxPersons;
        private String image;
        private List<String> images;
        private List<String> features;
        private List<String> inclusions;
        private List<String> exclusions;
        private Boolean isActive;
        private Boolean isFeatured;
        private Boolean isLimitedOffer;
        private Integer availableQuantity;
        private Integer soldCount;
        private Double rating;
        private Integer reviewCount;
        private LocalDateTime validFrom;
        private LocalDateTime validUntil;
        private Long siteId;
        private String siteName;
        private LocalDateTime createdAt;
    }
}
