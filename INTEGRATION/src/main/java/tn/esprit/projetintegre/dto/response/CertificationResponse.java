package tn.esprit.projetintegre.dto.response;

import lombok.*;
import tn.esprit.projetintegre.enums.CertificationStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CertificationResponse {
    private Long id;
    private String certificationCode;
    private String title;
    private String description;
    private String issuingOrganization;
    private LocalDate issueDate;
    private LocalDate expirationDate;
    private CertificationStatus status;
    private String documentUrl;
    private String verificationUrl;
    private Integer score;
    private Long userId;
    private String userName;
    private Long siteId;
    private List<CertificationItemResponse> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
