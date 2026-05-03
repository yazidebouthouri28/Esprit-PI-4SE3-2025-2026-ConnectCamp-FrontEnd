package tn.esprit.projetintegre.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import tn.esprit.projetintegre.enums.CriterieName;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CertificationItemRequest {
    @NotBlank(message = "Item name is required")
    @Size(max = 200)
    private String name;

    @Size(max = 1000)
    private String description;

    @Min(value = 0, message = "Score must be positive")
    @Max(value = 10, message = "Score cannot exceed 10")
    private Integer score;

    @Min(value = 0, message = "Required score must be positive")
    private Integer requiredScore;

    private Boolean passed;

    private LocalDateTime completedAt;

    @NotNull(message = "Criteria name is required")
    private CriterieName criteriaName;

    private String comment;

    @NotNull(message = "Certification ID is required")
    private Long certificationId;
}
