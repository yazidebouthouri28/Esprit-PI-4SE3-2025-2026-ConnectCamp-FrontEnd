package tn.esprit.projetintegre.dto.response;

import lombok.*;
import tn.esprit.projetintegre.enums.RentalStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class RentalResponse {
    private Long id;
    private String rentalNumber;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate actualReturnDate;
    private RentalStatus status;
    private BigDecimal subtotal;
    private BigDecimal deposit;
    private BigDecimal discount;
    private BigDecimal totalAmount;
    private BigDecimal lateFees;
    private String notes;
    private String returnCondition;
    private Boolean depositReturned;
    private Long userId;
    private String userName;
    private Long siteId;
    private String siteName;
    private List<RentalProductResponse> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
