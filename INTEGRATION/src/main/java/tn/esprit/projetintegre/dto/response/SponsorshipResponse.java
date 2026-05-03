package tn.esprit.projetintegre.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SponsorshipResponse {
    private Long id;
    private Long sponsorId;
    private String sponsorName;
    private Long eventId;
    private String eventTitle;
    private String sponsorshipType;
    private String sponsorshipLevel;
    private String description;
    private BigDecimal amount;
    private String currency;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean isPaid;
    private LocalDateTime paidAt;
    private String benefits;
    private String deliverables;
    private Boolean isActive;
    private String status;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
