package tn.esprit.projetintegre.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import tn.esprit.projetintegre.enums.TicketRequestStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class TicketRequestDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        @NotNull(message = "L'ID de l'événement est obligatoire")
        private Long eventId;

        @NotNull(message = "La quantité est obligatoire")
        @Min(value = 1, message = "La quantité doit être au moins 1")
        @Max(value = 10, message = "La quantité ne peut pas dépasser 10")
        private Integer quantity;

        @Size(max = 1000, message = "Le message ne peut pas dépasser 1000 caractères")
        private String message;

        @Size(max = 100, message = "Le type de ticket ne peut pas dépasser 100 caractères")
        private String ticketType;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        @Min(value = 1, message = "La quantité doit être au moins 1")
        @Max(value = 10, message = "La quantité ne peut pas dépasser 10")
        private Integer quantity;

        @Size(max = 1000, message = "Le message ne peut pas dépasser 1000 caractères")
        private String message;

        @Size(max = 100, message = "Le type de ticket ne peut pas dépasser 100 caractères")
        private String ticketType;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProcessRequest {
        @NotNull(message = "Le statut est obligatoire")
        private TicketRequestStatus status;

        @Size(max = 1000, message = "Le message de réponse ne peut pas dépasser 1000 caractères")
        private String responseMessage;

        @Size(max = 500, message = "Les notes admin ne peuvent pas dépasser 500 caractères")
        private String adminNotes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private String requestNumber;
        private Integer quantity;
        private TicketRequestStatus status;
        private String message;
        private String responseMessage;
        private String ticketType;
        private BigDecimal totalPrice;
        private LocalDateTime requestedAt;
        private LocalDateTime processedAt;
        private LocalDateTime expiresAt;
        private Long userId;
        private String userName;
        private Long eventId;
        private String eventTitle;
        private Long processedById;
        private String processedByName;
        private LocalDateTime createdAt;
    }
}
