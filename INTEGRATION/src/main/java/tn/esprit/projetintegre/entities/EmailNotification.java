package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import tn.esprit.projetintegre.enums.EmailType;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "email_notifications", indexes = {
    @Index(name = "idx_email_user", columnList = "user_id"),
    @Index(name = "idx_email_type", columnList = "emailType"),
    @Index(name = "idx_email_sent", columnList = "sent"),
    @Index(name = "idx_email_date", columnList = "sentAt")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EmailNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "L'adresse email est obligatoire")
    @Email(message = "L'email doit être valide")
    @Size(max = 200, message = "L'email ne peut pas dépasser 200 caractères")
    private String toEmail;

    @Size(max = 200, message = "L'email CC ne peut pas dépasser 200 caractères")
    private String ccEmail;

    @Size(max = 200, message = "L'email BCC ne peut pas dépasser 200 caractères")
    private String bccEmail;

    @NotBlank(message = "Le sujet est obligatoire")
    @Size(max = 500, message = "Le sujet ne peut pas dépasser 500 caractères")
    @Column(length = 500)
    private String subject;

    @NotBlank(message = "Le contenu est obligatoire")
    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(columnDefinition = "TEXT")
    private String htmlContent;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "Le type d'email est obligatoire")
    private EmailType emailType;

    @Size(max = 100, message = "Le nom du template ne peut pas dépasser 100 caractères")
    private String templateName;

    @Builder.Default
    private Boolean sent = false;

    private LocalDateTime sentAt;

    @Builder.Default
    private Boolean opened = false;

    private LocalDateTime openedAt;

    @Builder.Default
    private Boolean clicked = false;

    private LocalDateTime clickedAt;

    @Builder.Default
    private Integer retryCount = 0;

    @Size(max = 1000, message = "Le message d'erreur ne peut pas dépasser 1000 caractères")
    @Column(length = 1000)
    private String errorMessage;

    @ElementCollection
    @CollectionTable(name = "email_attachments", joinColumns = @JoinColumn(name = "email_id"))
    @Column(name = "attachment_url")
    @Builder.Default
    private List<String> attachments = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
